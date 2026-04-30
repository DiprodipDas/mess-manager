import React from 'react';
import { Github, Linkedin, Mail, MapPin, Heart, Code2, Database, Layout } from 'lucide-react';
import { toast } from 'react-toastify';

const DeveloperProfile = () => {
    const handleCopyEmail = () => {
        navigator.clipboard.writeText('diprodip755@gmail.com');
        toast.success('Email copied!');
    };

    const developer = {
        name: "Diprodip Das",
        role: "Full Stack Developer",
        location: "Dhaka, Bangladesh",
        email: "diprodip755@gmail.com",
        github: "https://github.com/diprodipdas",
        linkedin: "https://www.linkedin.com/in/diprodip-das-4a5b761ba/",
        imageUrl: "https://i.ibb.co.com/S7WPHpwZ/1769792877429.png"
    };

    const skills = ["React", "Node.js", "Express", "MySQL", "Tailwind CSS", "JWT", "Vercel", "Git"];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Developer
                </h1>
                <p className="text-gray-500">About the creator</p>
            </div>

            {/* Larger card for large screens */}
            <div className="max-w-4xl mx-auto lg:max-w-5xl xl:max-w-6xl">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 lg:p-10 text-center">
                    {/* Profile Image - Larger on desktop */}
                    <div className="flex justify-center">
                        <img 
                            src={developer.imageUrl}
                            alt={developer.name}
                            className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full mx-auto mb-4 border-4 border-blue-100 object-cover"
                        />
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800">{developer.name}</h2>
                    <p className="text-blue-600 text-base md:text-lg mb-3">{developer.role}</p>
                    <p className="text-gray-500 text-sm md:text-base flex items-center justify-center gap-1 mb-6">
                        <MapPin className="w-4 h-4" /> {developer.location}
                    </p>
                    
                    {/* Contact Buttons - Larger */}
                    <div className="flex justify-center gap-4 mb-8">
                        <button 
                            onClick={handleCopyEmail} 
                            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            <Mail className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                            <span className="text-sm md:text-base text-gray-700">Email</span>
                        </button>
                        <a 
                            href={developer.github} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            <Github className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                            <span className="text-sm md:text-base text-gray-700">GitHub</span>
                        </a>
                        <a 
                            href={developer.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            <Linkedin className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                            <span className="text-sm md:text-base text-gray-700">LinkedIn</span>
                        </a>
                    </div>


                    {/* About Project - More content on larger screens */}
                    <div className="border-t border-gray-100 pt-6">
                        <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto">
                            Built this Mess Management System to solve real-world mess tracking challenges. 
                            The system handles meal tracking, expense management, guest meals, fixed bills, 
                            and provides comprehensive reports with PDF/Excel exports.
                        </p>
                    </div>

                    {/* Footer */}
                    <p className="text-xs text-gray-400 mt-6 flex items-center justify-center gap-1">
                        Made with <Heart className="w-3 h-3 text-red-500" /> by {developer.name}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DeveloperProfile;