// @ts-nocheck
export const serializeNonPOJOs = (value) => {
    if (Array.isArray(value)) {
        return value.map(serializeNonPOJOs);
    } else if (value && typeof value === 'object') {
        const obj = {};
        for (const key in value) {
            if (key === '_id' && value[key] && typeof value[key].toString === 'function') {
                obj[key] = value[key].toString();
            } else {
                obj[key] = serializeNonPOJOs(value[key]);
            }
        }
        return obj;
    }
    return value;
};
