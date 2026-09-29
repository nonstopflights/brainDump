import {DatabaseSync} from 'node:sqlite';
import {access,cp,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {dataDir} from '../lib/store';
import {ensurePostgres,postgresPool} from '../lib/postgres';
import {stateSchema} from '../lib/schema';
import type {State} from '../lib/types';

async function main(){
const source=path.resolve(process.env.DAYBOOK_SQLITE_SOURCE||path.join(dataDir,'daybook.sqlite'));
const sourceDir=path.dirname(source);
const sqlite=new DatabaseSync(source,{readOnly:true});
try {
  const row=sqlite.prepare('SELECT body FROM state WHERE id=1').get() as {body:string}|undefined;
  if(!row)throw new Error('No Daybook journal was found in the SQLite source');
  const state=stateSchema.parse(JSON.parse(row.body));
  const messages=sqlite.prepare('SELECT guid,card_id FROM messages').all() as {guid:string;card_id:string}[];
  const files=sqlite.prepare('SELECT id,name,type,size FROM files').all() as {id:string;name:string;type:string;size:number}[];
  const remindersTable=sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='delivered_reminders'").get();
  const delivered=remindersTable?sqlite.prepare('SELECT key FROM delivered_reminders').all() as {key:string}[]:[];
  for(const file of files){if(!/^[a-f0-9-]{36}$/.test(file.id))throw new Error('Invalid attachment ID in SQLite');await access(path.join(sourceDir,'attachments',file.id));}

  await ensurePostgres();
  const client=await postgresPool().connect();
  try {
    await client.query('BEGIN');
    const current=(await client.query<{body:State}>('SELECT body FROM daybook.state WHERE id=1 FOR UPDATE')).rows[0]?.body;
    const sampleIds=['welcome','garden','groceries','website','walk','dinner'];
    const pristine=current?.version===1&&current.cards.length===sampleIds.length&&sampleIds.every(id=>current.cards.some(card=>card.id===id));
    const counts=await client.query<{messages:string;files:string;reminders:string}>(
      'SELECT (SELECT count(*) FROM daybook.messages)::text AS messages,(SELECT count(*) FROM daybook.files)::text AS files,(SELECT count(*) FROM daybook.delivered_reminders)::text AS reminders'
    );
    if(!pristine||counts.rows[0].messages!=='0'||counts.rows[0].files!=='0'||counts.rows[0].reminders!=='0'){
      throw new Error('PostgreSQL already has Daybook data. Migration will not overwrite it.');
    }

    if(files.length&&sourceDir!==path.resolve(dataDir)){
      await mkdir(path.join(dataDir,'attachments'),{recursive:true});
      await cp(path.join(sourceDir,'attachments'),path.join(dataDir,'attachments'),{recursive:true,force:false,errorOnExist:true});
    }
    await client.query('UPDATE daybook.state SET body=$1::jsonb WHERE id=1',[JSON.stringify(state)]);
    for(const message of messages)await client.query('INSERT INTO daybook.messages(guid,card_id) VALUES($1,$2)',[message.guid,message.card_id]);
    for(const file of files)await client.query('INSERT INTO daybook.files(id,name,type,size) VALUES($1,$2,$3,$4)',[file.id,file.name,file.type,file.size]);
    for(const reminder of delivered)await client.query('INSERT INTO daybook.delivered_reminders(key) VALUES($1)',[reminder.key]);
    await client.query('COMMIT');
    console.log(`Migrated ${state.cards.length} cards, ${state.tags.length} tags, ${messages.length} iMessage records, ${files.length} attachments, and ${delivered.length} delivered reminders.`);
    console.log('SQLite source remains unchanged. Set DAYBOOK_DATABASE=postgres and restart Daybook.');
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
} finally {
  sqlite.close();
  await postgresPool().end();
}
}
void main().catch(error=>{console.error(error instanceof Error?error.message:'Migration failed');process.exitCode=1;});
