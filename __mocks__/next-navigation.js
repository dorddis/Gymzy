/**
 * Next.js Navigation Mock (App Router)
 * Mock implementation of Next.js app router navigation for testing
 */

const mockPathname = '/';
const mockSearchParams = new URLSearchParams();

export const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
});

export const usePathname = () => mockPathname;

export const useSearchParams = () => mockSearchParams;

export const useParams = () => ({});

export const redirect = jest.fn();

export const notFound = jest.fn();

export default {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
  redirect,
  notFound,
};
