// File: src/utils/formatters.js

/**
 * Chuyển đổi chuỗi ISO DateTime thành định dạng "X [đơn vị] trước".
 * @param {string | Date | null | undefined} isoDateTime - Chuỗi ISO 8601 hoặc đối tượng Date.
 * @returns {string} Chuỗi định dạng thời gian tương đối hoặc chuỗi rỗng nếu đầu vào không hợp lệ.
 */
export function formatTimeAgo(isoDateTime) {
    if (!isoDateTime) return '';
    try {
        const date = (isoDateTime instanceof Date) ? isoDateTime : new Date(isoDateTime);
        if (isNaN(date.getTime())) {
            console.error("Invalid date provided to formatTimeAgo:", isoDateTime);
            return '';
        }
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 0) return "Ngay bây giờ";
        if (seconds < 5) return "Vừa xong";
        if (seconds < 60) return `${Math.floor(seconds)} giây trước`;
        const minutes = seconds / 60;
        if (minutes < 60) return `${Math.floor(minutes)} phút trước`;
        const hours = minutes / 60;
        if (hours < 24) return `${Math.floor(hours)} giờ trước`;
        const days = hours / 24;
        if (days < 7) return `${Math.floor(days)} ngày trước`;
        const weeks = days / 7;
        if (weeks < 4.345) return `${Math.floor(weeks)} tuần trước`;
        const months = days / 30.417;
        if (months < 12) return `${Math.floor(months)} tháng trước`;
        const years = days / 365.25;
        return `${Math.floor(years)} năm trước`;
    } catch (e) {
        console.error("Error formatting time ago:", e, isoDateTime);
        return '';
    }
}

/**
 * Định dạng kích thước file từ bytes sang KB, MB, GB...
 * @param {number | null | undefined} bytes - Kích thước file (bytes).
 * @param {number} decimals - Số chữ số thập phân (mặc định là 1).
 * @returns {string} Chuỗi định dạng kích thước file hoặc 'N/A'.
 */
export function formatFileSize(bytes, decimals = 1) {
    if (bytes === null || bytes === undefined || typeof bytes !== 'number' || bytes < 0) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    try {
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        if (i < 0 || i >= sizes.length) return `${bytes.toFixed(dm)} Bytes`;
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    } catch(e) {
        console.error("Error formatting file size:", e, bytes);
        return 'N/A';
    }
}