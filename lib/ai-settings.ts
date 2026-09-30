import {ensurePostgres,postgresEnabled,postgresPool} from './postgres';

export type AiSettings={key:string;model:string;source:'settings'|'environment'|'none'};
const defaultModel='gpt-5.4-nano';

export async function readAiSettings():Promise<AiSettings>{
  if(!postgresEnabled)throw new Error('OpenAI settings require PostgreSQL');
  await ensurePostgres();
  const row=(await postgresPool().query<{api_key:string|null;model:string|null}>('SELECT api_key,model FROM daybook.ai_settings WHERE id=1')).rows[0];
  const key=row?.api_key??process.env.OPENAI_API_KEY??'';
  return {key,model:row?.model||process.env.OPENAI_SUMMARY_MODEL||defaultModel,source:row?.api_key!==null&&row?.api_key!==undefined?'settings':process.env.OPENAI_API_KEY?'environment':'none'};
}
export async function writeAiSettings(patch:{key?:string;model:string}):Promise<AiSettings>{
  if(!postgresEnabled)throw new Error('OpenAI settings require PostgreSQL');
  await ensurePostgres();
  await postgresPool().query('INSERT INTO daybook.ai_settings(id,api_key,model) VALUES(1,$1,$2) ON CONFLICT(id) DO UPDATE SET api_key=COALESCE(EXCLUDED.api_key,daybook.ai_settings.api_key),model=EXCLUDED.model',[patch.key??null,patch.model]);
  return readAiSettings();
}
