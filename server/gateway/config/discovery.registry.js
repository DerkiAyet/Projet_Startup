function getServiceUrl(eurekaClient, serviceName) {
    const instances = eurekaClient.getInstancesByAppId(serviceName.toUpperCase());
    if (!instances || instances.length === 0) {
        throw new Error(`No instances available for ${serviceName}`);
    }
    // pick the first instance for simplicity
    const instance = instances[0];
    const host = instance.hostName;
    const port = instance.port.$; // Eureka stores port in 'port.$'
    const protocol = instance.securePort && instance.securePort.$ ? 'https' : 'http';
    return `${protocol}://${host}:${port}`;
}

module.exports = { getServiceUrl }