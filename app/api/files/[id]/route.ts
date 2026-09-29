import {NextRequest} from 'next/server';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {authorize,errorResponse} from '@/lib/auth';
import {findFile,dataDir,HttpError} from '@/lib/store';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{authorize(req);const {id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))throw new HttpError(404,'File not found');const file=await findFile(id);if(!file)throw new HttpError(404,'File not found');const data=await readFile(path.join(dataDir,'attachments',id));const inline=['image/png','image/jpeg','image/webp','image/gif','image/avif'].includes(file.type);return new Response(data,{headers:{'Content-Type':inline?file.type:'application/octet-stream','Content-Disposition':`${inline?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(file.name)}`,'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});}catch(e){return errorResponse(e);}}
