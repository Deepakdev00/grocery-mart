import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders grocery mart app with default unauthenticated about view', () => {
  render(<App />);
  // Unauthenticated user should see About Us content / brand
  expect(screen.getByText(/About Grocery Mart/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /About Us/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Contact Us/i })).toBeInTheDocument();
});
