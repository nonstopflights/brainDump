import {NextRequest} from 'next/server';
import {errorResponse,equal} from '@/lib/auth';
import {HttpError} from '@/lib/store';
import {normalizeMessage,checkMessageAccess,receiveMessage} from '@/lib/imessage';
export async function POST(req:NextRequest){try{const token=req.headers.get('authorization')?.replace(/^Bearer /,'')||req.nextUrl.searchParams.get('token')||'';if(!process.env.IMESSAGE_TOKEN)throw new HttpError(503,'iMessage capture is not configured');if(!equal(token,process.env.IMESSAGE_TOKEN))throw new HttpError(401,'Invalid receiver token');const message=normalizeMessage(await req.json());checkMessageAccess(token,message);return Response.json(await receiveMessage(message));}catch(e){return errorResponse(e);}}
