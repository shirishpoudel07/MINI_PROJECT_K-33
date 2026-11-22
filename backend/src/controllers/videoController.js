import prisma from '../prisma.js';

export const getVideos = async (req, res) => {
  try {
    const { category, search } = req.query;
    const where = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const videos = await prisma.exerciseVideo.findMany({
      where,
      orderBy: { id: 'asc' }
    });
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch exercise videos' });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await prisma.exerciseVideo.findUnique({
      where: { id }
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
};

export const createVideo = async (req, res) => {
  try {
    const { title, duration, thumbnail, videoUrl, category, description } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'Title and videoUrl are required' });
    }

    const id = `vid_${Date.now()}`;
    const video = await prisma.exerciseVideo.create({
      data: {
        id,
        title,
        duration: duration || '2:00',
        thumbnail: thumbnail || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
        videoUrl,
        category: category || 'General Rehabilitation',
        description: description || ''
      }
    });

    res.status(201).json(video);
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ error: 'Failed to create exercise video' });
  }
};

