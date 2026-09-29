import {NextRequest} from 'next/server';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {authorize,errorResponse} from '@/lib/auth';
import {saveFile,dataDir,HttpError} from '@/lib/store';
export async function POST(req:NextRequest){try{authorize(req);if(Number(req.headers.get('content-length'))>21000000)throw new HttpError(413,'Files must be smaller than 20 MB');const form=await req.formData(),file=form.get('file');if(!(file instanceof File)||file.size>20000000||file.size===0)throw new HttpError(400,'Choose a file smaller than 20 MB');const id=crypto.randomUUID(),name=file.name.slice(0,500),type=file.type||'application/octet-stream';await mkdir(path.join(dataDir,'attachments'),{recursive:true});await writeFile(path.join(dataDir,'attachments',id),Buffer.from(await file.arrayBuffer()));await saveFile({id,name,type,size:file.size});return Response.json({id,name,type,size:file.size});}catch(e){return errorResponse(e);}}
