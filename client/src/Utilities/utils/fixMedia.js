export const fixMediaUrl = (url) => {
    if (!url) return null;
    return url.replace('http://gateway:8082', process.env.REACT_APP_API_URL_GATEWAY);
}
