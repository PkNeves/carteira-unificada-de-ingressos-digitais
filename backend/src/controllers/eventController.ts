import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import prisma from "../utils/prisma";

export async function createEvent(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      bannerUrl,
      postbackUrl,
      externalId,
      active,
    } = req.body;

    const event = await prisma.event.create({
      data: {
        companyId: req.userId!,
        name,
        description: description || null,
        bannerUrl: bannerUrl,
        postbackUrl: postbackUrl && postbackUrl !== "" ? postbackUrl : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        externalId,
        active: active !== undefined ? active : true,
      },
    });

    res.status(201).json({
      message: "Evento criado com sucesso",
      event,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function listEvents(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const events = await prisma.event.findMany({
      where: {
        companyId: req.userId!,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getEvent(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const event = await prisma.event.findFirst({
      where: {
        id,
        companyId: req.userId!,
      },
      include: {
        tickets: {
          select: {
            id: true,
            externalId: true,
            name: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      res.status(404).json({ error: "Evento não encontrado" });
      return;
    }

    res.json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateEvent(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      startDate,
      endDate,
      bannerUrl,
      postbackUrl,
      active,
    } = req.body;

    // Verifica se evento existe e pertence à company
    const event = await prisma.event.findFirst({
      where: {
        id,
        companyId: req.userId!,
      },
    });

    if (!event) {
      res.status(404).json({ error: "Evento não encontrado" });
      return;
    }

    const now = new Date();
    const eventStartDate = new Date(event.startDate);

    if (eventStartDate < now) {
      res.status(403).json({
        error: "Não é possível alterar um evento cuja data de início já passou",
      });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined)
      updateData.endDate = endDate ? new Date(endDate) : null;
    if (bannerUrl !== undefined)
      updateData.bannerUrl = bannerUrl && bannerUrl !== "" ? bannerUrl : null;
    if (postbackUrl !== undefined)
      updateData.postbackUrl =
        postbackUrl && postbackUrl !== "" ? postbackUrl : null;
    if (active !== undefined) updateData.active = active;

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: "Evento atualizado com sucesso",
      event: updatedEvent,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteEvent(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const event = await prisma.event.findFirst({
      where: {
        id,
        companyId: req.userId!,
      },
    });

    if (!event) {
      res.status(404).json({ error: "Evento não encontrado" });
      return;
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { active: false },
    });

    res.json({
      message: "Evento desabilitado com sucesso",
      event: updatedEvent,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
