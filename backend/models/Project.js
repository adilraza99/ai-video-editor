import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please provide a project name'],
        trim: true,
        maxlength: [100, 'Project name cannot be more than 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    thumbnail: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['draft', 'processing', 'completed', 'failed'],
        default: 'draft'
    },
    timeline: {
        duration: {
            type: Number, // in seconds
            default: 0
        },
        tracks: {
            type: mongoose.Schema.Types.Mixed, // JSON structure for timeline data
            default: {
                video: [],
                audio: [],
                captions: [],
                effects: []
            }
        }
    },
    settings: {
        resolution: {
            width: { type: Number, default: 1920 },
            height: { type: Number, default: 1080 }
        },
        frameRate: {
            type: Number,
            default: 30
        },
        aspectRatio: {
            type: String,
            default: '16:9'
        },
        background: {
            type: {
                type: String,
                enum: ['color', 'template', 'blur', 'custom'],
                default: 'color'
            },
            value: {
                type: String,
                default: '#000000'
            }
        }
    },
    voiceover: {
        enabled: {
            type: Boolean,
            default: false
        },
        voice: {
            type: String,
            default: null
        },
        language: {
            type: String,
            default: 'en-US'
        },
        script: {
            type: String,
            default: null
        }
    },
    captions: {
        enabled: {
            type: Boolean,
            default: false
        },
        language: {
            type: String,
            default: 'en'
        },
        style: {
            type: mongoose.Schema.Types.Mixed,
            default: {
                fontSize: 24,
                fontFamily: 'Arial',
                color: '#FFFFFF',
                backgroundColor: '#000000',
                position: 'bottom'
            }
        },
        data: [{
            startTime: Number,
            endTime: Number,
            text: String
        }]
    },
    music: {
        enabled: {
            type: Boolean,
            default: false
        },
        track: {
            type: String,
            default: null
        },
        volume: {
            type: Number,
            default: 0.3,
            min: 0,
            max: 1
        }
    },
    exportSettings: {
        format: {
            type: String,
            enum: ['mp4', 'webm', 'mov'],
            default: 'mp4'
        },
        quality: {
            type: String,
            enum: ['low', 'medium', 'high', 'ultra'],
            default: 'high'
        }
    },
    outputVideo: {
        type: String,
        default: null
    },
    processingProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

const Project = mongoose.model('Project', projectSchema);

export default Project;
