import {NextRequest} from 'next/server';
import {authorize,errorResponse} from '@/lib/auth';
import {readState,mutation} from '@/lib/store';
export const runtime='nodejs';
export async function GET(req:NextRequest){try{authorize(req);return Response.json(await readState(),{headers:{'Cache-Control':'no-store'}});}catch(e){return errorResponse(e);}}
export async function POST(req:NextRequest){try{authorize(req);if(Number(req.headers.get('content-length'))>15000000)return Response.json({error:'Import too large'},{status:413});return Response.json(await mutation(await req.json()));}catch(e){return errorResponse(e);}}
