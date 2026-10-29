import {createApp} from './app.mjs';
const app=await createApp();
app.listen(Number(process.env.PORT||3001),'127.0.0.1',()=>console.log(`Vastukala API ready at http://127.0.0.1:${process.env.PORT||3001}`));
