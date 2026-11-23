// Reutiliza el servidor demo aislado; no compila ni modifica configuración pública.
const {createMotor01Server}=require('./motor01-preview.cjs');
if(require.main===module){
  const server=createMotor01Server();
  server.on('error',error=>{console.error(error.message);process.exitCode=1});
  server.listen(8913,'127.0.0.1',()=>console.log('Inicio ADC: http://127.0.0.1:8913/adc/index.html?adc-preview=1&adc-inicio=1&adc-motor01=incapacidad'));
}
