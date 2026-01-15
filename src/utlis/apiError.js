class apiError extends Error {
    constructor(
        StatusCode,
        message = 'Something went wrong',
        errors =[],
        stack = ''
    ){
        super(message)
        this.StatusCode = StatusCode
        this.data = null
        this.message = message
        this.errors = errors
        this.success = false

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { apiError}