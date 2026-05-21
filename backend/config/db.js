import mongoose from 'mongoose';

export async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGODB_URL)
        console.log('Connected to MongoDB')
    }
    catch(error){
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}