export const formatUuid = (uuid: string): string => {
    if (!uuid) return '';
    // If already has dashes or incorrect length, return as is (or handle errors)
    if (uuid.includes('-') || uuid.length !== 32) {
        return uuid;
    }
    
    // Insert dashes: 8-4-4-4-12
    return `${uuid.substring(0, 8)}-${uuid.substring(8, 12)}-${uuid.substring(12, 16)}-${uuid.substring(16, 20)}-${uuid.substring(20)}`;
};
