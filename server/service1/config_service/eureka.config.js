require('dotenv').config({ path: './config.env' });

module.exports = {
  instance: {
    app: "SERVICE1-AUTH",
    hostName: process.env.HOST,
    ipAddr: process.env.IP,
    port: {
      $: process.env.PORT,
      "@enabled": true,
    },
    vipAddress: "SERVICE1-AUTH",
    dataCenterInfo: {
      "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
      name: "MyOwn",
    },
    registerWithEureka: true,
    fetchRegistry: true,
    statusPageUrl: `http://${process.env.HOST}:${process.env.PORT}/info`,
    healthCheckUrl: `http://${process.env.HOST}:${process.env.PORT}/health`,
    homePageUrl: `http://${process.env.HOST}:${process.env.PORT}`,
  },
  eureka: {
    host: process.env.EUREKA_HOST,
    port: process.env.EUREKA_PORT,
    servicePath: "/eureka/apps/",
    maxRetries: 10,
    requestRetryDelay: 2000,
  },
};
