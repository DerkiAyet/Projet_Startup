require('dotenv').config({ path: './config.env' });
const eurekaClient = require('./eureka.client');

async function discoverAuthService() {
  try {
    const instances = eurekaClient.getInstancesByAppId(process.env.AUTH_SERVICE_NAME);

    if (!instances || instances.length === 0) {
      console.warn("Aucune instance AUTH-SERVICE disponible via Eureka, utilisation de la configuration par défaut");
      return process.env.AUTH_SERVICE_URL;
    }

    const instance = instances[Math.floor(Math.random() * instances.length)];
    const baseUrl = `http://${instance.hostName}:${instance.port["$"] || 8000}`;
    console.log(`Utilisation de l'instance AUTH-SERVICE: ${baseUrl}`);
    return baseUrl;
  } catch (error) {
    console.error("Erreur de découverte de service:", error);
    return process.env.AUTH_SERVICE_URL;
  }
}

async function discoverNotifService() {
  try {
    const instances = eurekaClient.getInstancesByAppId(process.env.NOTIFICATIONS_SERVICE_NAME);

    if (!instances || instances.length === 0) {
      console.warn("Aucune instance NOTIFICATIONS_SERVICE disponible via Eureka, utilisation de la configuration par défaut");
      return process.env.NOTIFICATIONS_SERVICE_URL;
    }

    const instance = instances[Math.floor(Math.random() * instances.length)];
    const baseUrl = `http://${instance.hostName}:${instance.port["$"] || 8000}`;
    console.log(`Utilisation de l'instance NOTIFICATIONS_SERVICE: ${baseUrl}`);
    return baseUrl;
  } catch (error) {
    console.error("Erreur de découverte de service:", error);
    return process.env.NOTIFICATIONS_SERVICE_URL;
  }
}

module.exports = { discoverAuthService, discoverNotifService };