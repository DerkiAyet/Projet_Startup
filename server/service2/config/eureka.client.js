const Eureka = require('eureka-js-client').Eureka;
const eurekaConfig = require('./eureka.config');

const eurekaClient = new Eureka(eurekaConfig);

module.exports = eurekaClient;