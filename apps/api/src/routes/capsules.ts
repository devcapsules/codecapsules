import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../../../../packages/database/src/client';

const router = Router();

// Temporary mock data for development
const mockCapsules: any[] = [];

// Using real database queries instead of mock data

// GET /api/my-capsules - Fetch user's capsules
router.get('/my-capsules', async (req: Request, res: Response) => {
  try {
    // For now, fetch all capsules since we don't have user auth implemented
    // TODO: Add user authentication and filter by creatorId
    const capsules = await prisma.capsule.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Transform database result to match frontend expectations
    const transformedCapsules = capsules.map((capsule: any) => ({
      id: capsule.id,
      title: capsule.title,
      description: capsule.description,
      type: capsule.type,
      language: capsule.language || 'JavaScript', // Provide default if null
      difficulty: capsule.difficulty,
      tags: capsule.tags,
      createdAt: capsule.createdAt.toISOString(),
      isPublished: capsule.isPublished,
      creator: {
        id: capsule.creator.id,
        name: capsule.creator.name,
        email: capsule.creator.email
      },
      // Extract analytics from the business JSON if available
      analytics: {
        impressions: 0, // Default values - can be calculated from actual data
        runs: 0,
        passRate: '0%'
      }
    }));
    
    res.json({
      success: true,
      capsules: transformedCapsules
    });
  } catch (error) {
    console.error('Error fetching capsules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch capsules'
    });
  }
});

// GET /api/capsules/:id - Fetch specific capsule
router.get('/capsules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const capsule = await prisma.capsule.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!capsule) {
      return res.status(404).json({
        success: false,
        error: 'Capsule not found'
      });
    }

    // Transform database result to match frontend expectations
    const transformedCapsule = {
      id: capsule.id,
      title: capsule.title,
      description: capsule.description,
      type: capsule.type,
      language: capsule.language || 'JavaScript',
      difficulty: capsule.difficulty,
      tags: capsule.tags,
      createdAt: capsule.createdAt.toISOString(),
      isPublished: capsule.isPublished,
      creator: {
        id: capsule.creator.id,
        name: capsule.creator.name,
        email: capsule.creator.email
      },
      content: capsule.content,
      runtime: capsule.runtime,
      analytics: {
        impressions: 0,
        runs: 0,
        passRate: '0%'
      }
    };
    
    res.json({
      success: true,
      capsule: transformedCapsule
    });
  } catch (error) {
    console.error('Error fetching capsule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch capsule'
    });
  }
});

// POST /api/capsules - Create new capsule
router.post('/capsules', async (req: Request, res: Response) => {
  try {
    const { title, description, language, difficulty, code, type = 'algorithm' } = req.body;
    
    if (!title || !description || !language || !code) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, language, code'
      });
    }
    
    const newCapsule = {
      id: String(Date.now()), // Simple ID generation
      title,
      description,
      type,
      language,
      difficulty: difficulty || 'Easy',
      tags: [], // You can extract tags from description or make it a parameter
      createdAt: new Date().toISOString(),
      isPublished: false,
      analytics: {
        impressions: 0,
        runs: 0,
        passRate: '0%'
      }
    };
    
    // In a real app, save to database
    mockCapsules.push(newCapsule);
    
    res.json({
      success: true,
      capsule: newCapsule
    });
  } catch (error) {
    console.error('Error creating capsule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create capsule'
    });
  }
});

// PUT /api/capsules/:id - Update capsule
router.put('/capsules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const capsuleIndex = mockCapsules.findIndex(c => c.id === id);
    if (capsuleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Capsule not found'
      });
    }
    
    // Update the capsule
    mockCapsules[capsuleIndex] = {
      ...mockCapsules[capsuleIndex],
      ...updates,
      id // Ensure ID doesn't change
    };
    
    res.json({
      success: true,
      capsule: mockCapsules[capsuleIndex]
    });
  } catch (error) {
    console.error('Error updating capsule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update capsule'
    });
  }
});

// DELETE /api/capsules/:id - Delete capsule
router.delete('/capsules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const capsuleIndex = mockCapsules.findIndex(c => c.id === id);
    
    if (capsuleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Capsule not found'
      });
    }
    
    // Remove the capsule
    mockCapsules.splice(capsuleIndex, 1);
    
    res.json({
      success: true,
      message: 'Capsule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting capsule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete capsule'
    });
  }
});

export default router;