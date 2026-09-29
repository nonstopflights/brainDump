import {DatabaseSync} from 'node:sqlite';
import {mkdir,cp,writeFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
const source=process.env.DAYBOOK_DATA_DIR||path.resolve('data');
const destination=path.resolve(process.argv[2]||path.join('backups',new Date().toISOString().replace(/[:.]/g,'-')));
await mkdir(destination,{recursive:true});
if(process.env.DAYBOOK_DATABASE==='postgres'){
  const args=['--format=custom','--schema=daybook','--file',path.join(destination,'daybook.pg.dump')];
  if(process.env.DATABASE_URL)args.push('--dbname',process.env.DATABASE_URL);
  await promisify(execFile)('pg_dump',args);
}else{
  const database=new DatabaseSync(path.join(source,'daybook.sqlite'));
  database.prepare('VACUUM INTO ?').run(path.join(destination,'daybook.sqlite'));
  database.close();
}
try{await cp(path.join(source,'attachments'),path.join(destination,'attachments'),{recursive:true,errorOnExist:true});}catch(e){if(e.code!=='ENOENT')throw e;}
const restore=process.env.DAYBOOK_DATABASE==='postgres'
  ? 'Stop Daybook and reminders before restoring. Restore daybook.pg.dump into the intended PostgreSQL database with pg_restore (the archive contains only the daybook schema). Restore attachments into DAYBOOK_DATA_DIR/attachments. Restart Daybook. Check the target database carefully before using --clean. .env.local is not included.\n'
  : 'Stop Daybook before restoring. Replace the contents of its data directory with daybook.sqlite and attachments from this backup. Remove old daybook.sqlite-wal and daybook.sqlite-shm files while the app is stopped. Restart Daybook. Your app password and integration configuration live in .env.local and are not included.\n';
await writeFile(path.join(destination,'RESTORE.txt'),restore);
console.log('Backup saved to '+destination);
