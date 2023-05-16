class ApiError extends Error {
    status: number;

    constructor(msg: string, status: number) {
        super(msg);
        this.status = status || 500;
    }
}

export default ApiError;