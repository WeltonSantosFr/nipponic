/// <reference types="vitest" />
import { renderHook, act } from '@testing-library/react';
import { FlashCardsProvider, useFlashCards } from './FlashCardsContext';
import { AuthProvider } from './AuthContext';
import { Deck, Card } from '@nipponic/shared';

// Mock the actions to simulate API delay
vi.mock('@/actions/cards', () => ({
  getCardsAction: vi.fn().mockResolvedValue([]),
  createCardAction: vi.fn().mockImplementation((data) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          id: `card-${Math.random()}`,
          ...data,
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          lapses: 0,
          nextReviewAt: new Date().toISOString(),
          lastReviewedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }, 50); // Simulate 50ms network latency
    });
  }),
}));

vi.mock('@/actions/decks', () => ({
  getDecksAction: vi.fn().mockResolvedValue([]),
  getPublicDecksAction: vi.fn().mockResolvedValue([]),
  createDeckAction: vi.fn().mockImplementation((data) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          id: `deck-${Math.random()}`,
          name: data.name,
          isPublic: false,
          cards: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }, 50); // Simulate 50ms network latency
    });
  }),
  addCardsToDeckAction: vi.fn().mockResolvedValue(true),
}));

// Mock useAuth to simulate being authenticated
vi.mock('./AuthContext', () => {
  const React = require('react');
  return {
    useAuth: () => ({ isAuthenticated: true }),
    AuthProvider: ({ children }: { children: React.ReactNode, initialUser?: any }) => React.createElement(React.Fragment, null, children),
  };
});

describe('FlashCardsContext Performance', () => {
  it('should add a deck with many cards efficiently', async () => {
    const { result } = renderHook(() => useFlashCards(), {
      wrapper: ({ children }) => (
        <AuthProvider initialUser={{sub: "test", username: "test", email: "test@test.com"}}>
          <FlashCardsProvider>{children}</FlashCardsProvider>
        </AuthProvider>
      ),
    });

    // Generate a mock deck with 20 cards
    const mockDeck: Deck = {
      id: 'mock-source-deck',
      name: 'Large Test Deck',
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cards: Array.from({ length: 20 }, (_, i) => ({
        id: `source-card-${i}`,
        jpText: `Japanese ${i}`,
        enText: `English ${i}`,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
        nextReviewAt: new Date().toISOString(),
        lastReviewedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    };

    const startTime = performance.now();

    await act(async () => {
      await result.current.addDeckToMyDecks(mockDeck);
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`⏱️ Baseline addDeckToMyDecks with 20 cards took: ${duration.toFixed(2)}ms`);

    // Write out the result to a file so we can compare
    const fs = require('fs');
    fs.writeFileSync('perf-result-baseline.txt', duration.toString());
  });
});
