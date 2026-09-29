import {NextRequest} from 'next/server';
import {authorize,errorResponse} from '@/lib/auth';
import {readState,HttpError} from '@/lib/store';
import {interpret} from '@/lib/capture';
export async function POST(req:NextRequest){try{authorize(req);const {text}=await req.json();if(typeof text!=='string'||!text.trim()||text.length>10000)throw new HttpError(400,'Write a thought first (up to 10,000 characters).');return Response.json(await interpret(text,(await readState()).tags));}catch(e){return errorResponse(e);}}
