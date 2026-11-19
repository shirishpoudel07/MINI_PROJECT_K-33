import prisma from '../prisma.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id },
      data: { isUnread: false }
    });
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { isUnread: true },
      data: { isUnread: false }
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { patientId, patientName, patientCondition, title, message, type = 'alert', time = 'Just now' } = req.body;
    const id = `n_${Date.now()}`;

    const notification = await prisma.notification.create({
      data: {
        id,
        patientId,
        patientName,
        patientCondition,
        title,
        message,
        type,
        time,
        isUnread: true
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('new_notification', notification);
    }

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

