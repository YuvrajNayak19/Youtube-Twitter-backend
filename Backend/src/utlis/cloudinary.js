import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

const uploadOnCloudinary = async (localFilePath) => {
    try {
        // Configure cloudinary inside the function to ensure env vars are loaded
        cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
            api_key: process.env.CLOUDINARY_API_KEY, 
            api_secret: process.env.CLOUDINARY_API_SECRET 
        })
        
        if (!localFilePath) {
            return null
        }
        
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        fs.unlinkSync(localFilePath)
        
        // Delete local file after successful upload
        try {
            fs.unlinkSync(localFilePath)
        } catch (unlinkError) {
            // Ignore file deletion errors
        }
        
        return response
    } catch (error) {
        // Delete the file if upload fails
        try {
            if (localFilePath && fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath)
            }
        } catch (unlinkError) {
            // Ignore file deletion errors
        }
        
        throw new Error(`Cloudinary upload failed: ${error.message}`)
    }
}

export { uploadOnCloudinary }