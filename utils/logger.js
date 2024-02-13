// import logger from "pino";
// import dayjs from "dayjs";
const pino = require("pino");
const dayjs = require("dayjs");
const pretty = require('pino-pretty')
// const log = logger({
//   prettyPrint: true,
//   base: {
//     pid: false,
//   },
//   timestamp: () => `,"time":"${dayjs().format()}"`,
// });

const log = pino(pretty({ 
    sync: true,
    
}));
//export default log;
module.exports = log;