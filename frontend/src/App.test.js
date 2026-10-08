import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders grocery mart app with default unauthenticated about view', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /a little fresher/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /About Us/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Contact Us/i })).toBeInTheDocument();
});
