class apiError extends Error {
    constructor(
        message = 'Something went wrong',
        StatusCode,
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