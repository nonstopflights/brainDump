import {NextRequest} from 'next/server';
import {authorize,errorResponse} from '@/lib/auth';
import {HttpError} from '@/lib/store';
import {readAiSettings,writeAiSettings,type AiSettings} from '@/lib/ai-settings';
export const runtime='nodejs';
function publicSettings(settings:AiSettings){return {keyConfigured:!!settings.key,model:settings.model,source:settings.source};}
export async function GET(req:NextRequest){try{authorize(req);return Response.json(publicSettings(await readAiSettings()),{headers:{'Cache-Control':'no-store'}});}catch(error){return errorResponse(error);}}
export async function POST(req:NextRequest){try{
  authorize(req);
  if(Number(req.headers.get('content-length'))>2048)throw new HttpError(413,'Settings too large');
  const body=await req.json();
  if(!body||typeof body!=='object'||typeof body.model!=='string'||!(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/).test(body.model))throw new HttpError(400,'Enter a valid model ID');
  if(body.key!==undefined&&(typeof body.key!=='string'||body.key.length>500||/\s/.test(body.key)))throw new HttpError(400,'Enter a valid API key');
  const settings=await writeAiSettings({model:body.model,...(body.key!==undefined?{key:body.key}:{})});
  return Response.json(publicSettings(settings),{headers:{'Cache-Control':'no-store'}});
}catch(error){return errorResponse(error);}}
