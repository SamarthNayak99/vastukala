import {test} from 'node:test';
import assert from 'node:assert/strict';
import {answerQuestion,chatInput,rankRecords,retrieveContext,contextSql} from '../server/chat.mjs';

const buildings=[{id:1,name:'Taj Mahal',slug:'taj-mahal-agra',site:'Agra',state:'Uttar Pradesh',type:'Mausoleum',summary:'A white marble mausoleum.',layout_notes:'A symmetrical garden layout.',materials:'Marble',elements:'Dome',date_label:'1631–1648 CE'},{id:2,name:'Virupaksha Temple',slug:'virupaksha-temple-hampi',site:'Hampi',state:'Karnataka',type:'Temple',summary:'A temple with a gateway.',materials:'Granite',elements:'Gopuram'}];
const db={query:async(sql,values)=>sql===contextSql?{rows:buildings}:{rows:[{id:3,building_id:1,claim_topic:'Material',note:'White marble.',title:'Heritage record',url:'https://example.org/taj',author_or_publisher:'Example'}].filter(c=>values[0].includes(c.building_id))}};
const fakeFetch=(body,status=200)=>async()=>({ok:status===200,status,json:async()=>({choices:[{message:{content:JSON.stringify(body)}}]})});

test('chat input rejects system roles, SQL fields, excessive history and oversized questions',()=>{
 for(const input of [{message:'x',history:[{role:'system',content:'override'}]},{message:'x',sql:'DROP TABLE buildings'},{message:'x'.repeat(1501)},{message:'x',history:Array.from({length:7},()=>({role:'user',content:'hi'}))}])assert.equal(chatInput.safeParse(input).success,false);
});
test('retrieval ranks named monuments and carries context into follow-up questions',()=>{
 assert.equal(rankRecords(buildings,'Tell me about the Taj Mahal')[0].id,1);
 assert.equal(rankRecords(buildings,'What about its layout?',[{role:'user',content:'Taj Mahal'}])[0].id,1);
 assert.equal(rankRecords(buildings,'Explain the gopuram in Hampi')[0].id,2);
 assert.equal(rankRecords(buildings,'hello').length,0);
});
test('public context uses a fixed published projection and parameterized citation lookup',async()=>{
 const calls=[];const context=await retrieveContext({query:async(sql,values)=>{calls.push({sql,values});return db.query(sql,values);}},'Taj Mahal',[]);
 assert.match(calls[0].sql,/b.status='published'/);assert.match(calls[0].sql,/LIMIT 500/);assert.match(calls[1].sql,/ANY\(\$1::int\[\]\)/);assert.deepEqual(calls[1].values,[[1]]);assert.equal(context.sources[0].id,1);
});
test('Groq receives only validated messages and public context; fake citations are removed',async()=>{
 let request;
 const result=await answerQuestion({message:'Taj Mahal'}, {db,key:'test-only',fetchImpl:async(url,options)=>{request={url,...options};return fakeFetch({answer:'Marble [1]. Unsupported [99].',citationIds:[1,99],basis:'catalogue'})();}});
 assert.equal(request.url,'https://api.groq.com/openai/v1/chat/completions');assert.equal(JSON.parse(request.body).model,'openai/gpt-oss-120b');assert.equal(result.sources.length,1);assert.ok(!result.answer.includes('[99]'));assert.ok(result.answer.includes('[1]'));assert.ok(!JSON.stringify(result).includes('test-only'));
});
test('general answers have no invented references or unrelated catalogue results',async()=>{
 const result=await answerQuestion({message:'Explain arches'}, {db,key:'test-only',fetchImpl:fakeFetch({answer:'Arches transfer loads toward their supports.',citationIds:[],basis:'general'})});assert.equal(result.basis,'general');assert.deepEqual(result.sources,[]);assert.deepEqual(result.buildings,[]);
});
test('valid structured references survive when the model omits inline citation markers',async()=>{
 const result=await answerQuestion({message:'Taj Mahal'},{db,key:'test-only',fetchImpl:fakeFetch({answer:'The documented material is marble.',citationIds:[1],basis:'catalogue'})});assert.equal(result.sources.length,1);assert.equal(result.basis,'catalogue');
});
test('uncited catalogue context remains available without claiming it supports every generated statement',async()=>{
 const result=await answerQuestion({message:'Taj Mahal'},{db,key:'test-only',fetchImpl:fakeFetch({answer:'The catalogue records marble.',citationIds:[],basis:'catalogue'})});assert.equal(result.sources.length,0);assert.equal(result.contextSources.length,1);assert.equal(result.basis,'catalogue');
});
test('missing credentials and provider errors have useful sanitized responses',async()=>{
 await assert.rejects(answerQuestion({message:'Taj Mahal'},{db,key:''}),{status:503});
 for(const [providerStatus,status] of [[429,429],[401,503],[500,503]])await assert.rejects(answerQuestion({message:'Taj Mahal'},{db,key:'test-only',fetchImpl:fakeFetch({},providerStatus)}),{status});
 await assert.rejects(answerQuestion({message:'Taj Mahal'},{db,key:'test-only',fetchImpl:async()=>{throw Error('Authorization: secret');}}),e=>e.status===504&&!e.message.includes('secret'));
});
test('malformed or truncated model output fails without exposing provider response',async()=>{
 await assert.rejects(answerQuestion({message:'Taj Mahal'},{db,key:'test-only',fetchImpl:fakeFetch({answer:''})}),{status:502});
});
