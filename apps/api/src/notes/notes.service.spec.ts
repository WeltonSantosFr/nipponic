import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma.service';

describe('NotesService', () => {
  let service: NotesService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      db: {
        orm: {
          public: {
            Note: {
              create: vi.fn(),
              where: vi.fn(),
            },
          },
        },
      },
    };

    service = new NotesService(prismaMock as unknown as PrismaService);
  });

  it('create - should create a new note', async () => {
    const newNoteDto = {
      title: 'Test Note',
      content: 'This is a test note.',
    };
    const createdNote = {
      id: 'note_123',
      ...newNoteDto,
      userId: 'usr_123',
    };
    prismaMock.db.orm.public.Note.create.mockResolvedValue(createdNote);

    const result = await service.create(newNoteDto as any, 'usr_123');

    expect(result).toEqual(createdNote);
    expect(prismaMock.db.orm.public.Note.create).toHaveBeenCalledWith({
      ...newNoteDto,
      userId: 'usr_123',
    });
  });

  it('findAll - should return a list of notes for a user', async () => {
    const mockNotes = [
      { id: 'note_1', title: 'Note 1', content: 'Content 1', userId: 'usr_123' },
      { id: 'note_2', title: 'Note 2', content: 'Content 2', userId: 'usr_123' },
    ];

    const allMock = vi.fn().mockResolvedValue(mockNotes);
    prismaMock.db.orm.public.Note.where.mockReturnValue({ all: allMock });

    const result = await service.findAll('usr_123');

    expect(result).toEqual(mockNotes);
    expect(prismaMock.db.orm.public.Note.where).toHaveBeenCalledWith({ userId: 'usr_123' });
    expect(allMock).toHaveBeenCalledTimes(1);
  });

  it('findOne - should return a note by id for the authenticated user', async () => {
    // Arrange
    const userId = 'usr_123';
    const noteId = 'note_456';
    const mockNote = {
      id: noteId,
      title: 'Grammar Notes',
      enText: 'Sample text',
      jpText: 'サンプルテキスト',
      userId,
    };
    const firstMock = vi.fn().mockResolvedValue(mockNote);
    prismaMock.db.orm.public.Note.where.mockReturnValue({ first: firstMock });

    // Act
    const result = await service.findOne(userId, noteId);

    // Assert
    expect(result).toEqual(mockNote);
    expect(prismaMock.db.orm.public.Note.where).toHaveBeenCalledWith({ id: noteId, userId });
    expect(firstMock).toHaveBeenCalledTimes(1);
  });

  it('findOne - should throw NotFoundException when note does not exist', async () => {
    // Arrange
    const userId = 'usr_123';
    const noteId = 'note_nonexistent';
    const firstMock = vi.fn().mockResolvedValue(null);
    prismaMock.db.orm.public.Note.where.mockReturnValue({ first: firstMock });

    // Act & Assert
    await expect(service.findOne(userId, noteId)).rejects.toThrow(
      new NotFoundException(`Note with ID "${noteId}" not found`),
    );
    expect(prismaMock.db.orm.public.Note.where).toHaveBeenCalledWith({ id: noteId, userId });
    expect(firstMock).toHaveBeenCalledTimes(1);
  });

  it('update - should update a note', async () => {
    const updateDto = { title: 'Updated Title' };
    const updatedNote = {
      id: 'note_123',
      title: 'Updated Title',
      content: 'Content',
      userId: 'usr_123',
    };

    const updateMock = vi.fn().mockResolvedValue(updatedNote);
    prismaMock.db.orm.public.Note.where.mockReturnValue({ update: updateMock });

    const result = await service.update('usr_123', 'note_123', updateDto as any);

    expect(result).toEqual(updatedNote);
    expect(prismaMock.db.orm.public.Note.where).toHaveBeenCalledWith({ id: 'note_123', userId: 'usr_123' });
    expect(updateMock).toHaveBeenCalledWith({ ...updateDto });
  });

  it('delete - should delete a note', async () => {
    const deleteMock = vi.fn().mockResolvedValue({ id: 'note_123' });
    prismaMock.db.orm.public.Note.where.mockReturnValue({ delete: deleteMock });

    const result = await service.delete('usr_123', 'note_123');

    expect(result).toEqual({ id: 'note_123' });
    expect(prismaMock.db.orm.public.Note.where).toHaveBeenCalledWith({ id: 'note_123', userId: 'usr_123' });
    expect(deleteMock).toHaveBeenCalledTimes(1);
  });
});
