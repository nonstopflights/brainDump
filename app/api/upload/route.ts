import {NextRequest} from 'next/server';
import {authorize,errorResponse} from '@/lib/auth';
import {saveFile,HttpError} from '@/lib/store';
export async function POST(req:NextRequest){try{authorize(req);if(Number(req.headers.get('content-length'))>21000000)throw new HttpError(413,'Files must be smaller than 20 MB');const form=await req.formData(),file=form.get('file');if(!(file instanceof File)||file.size>20000000||file.size===0)throw new HttpError(400,'Choose a file smaller than 20 MB');const id=crypto.randomUUID(),name=file.name.slice(0,500),type=file.type||'application/octet-stream';await saveFile({id,name,type,size:file.size},Buffer.from(await file.arrayBuffer()));return Response.json({id,name,type,size:file.size});}catch(e){return errorResponse(e);}}
