require('dotenv').config({ path: './config.env' });

module.exports = {
  instance: {
    app: "SERVICE1-AUTH",
    hostName: process.env.HOSTNAME,
    ipAddr: process.env.IP,
    port: {
      $: process.env.PORT,
      "@enabled": true,
    },
    vipAddress: "node-auth-service",
    dataCenterInfo: {
      "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
      name: "MyOwn",
    },
    registerWithEureka: true,
    fetchRegistry: true,
    statusPageUrl: `http://${process.env.HOSTNAME}:${process.env.PORT}/info`,
    healthCheckUrl: `http://${process.env.HOSTNAME}:${process.env.PORT}/health`,
    homePageUrl: `http://${process.env.HOSTNAME}:${process.env.PORT}`,
  },
  eureka: {
    host: process.env.EUREKA_HOST,
    port: process.env.EUREKA_PORT,
    servicePath: "/eureka/apps/",
    maxRetries: 10,
    requestRetryDelay: 2000,
  },
};
