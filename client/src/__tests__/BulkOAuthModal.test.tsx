
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkOAuthModal from '../components/modals/BulkOAuthModal';
import { toast } from '../components/ui/use-toast';

jest.mock('../components/ui/use-toast', () => ({
  toast: jest.fn()
}));

describe('BulkOAuthModal', () => {
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('renders modal when open', () => {
    render(<BulkOAuthModal open={true} onOpenChange={mockOnOpenChange} />);
    expect(screen.getByText('Create Bulk OAuth Credentials')).toBeInTheDocument();
  });

  it('validates form inputs', async () => {
    render(<BulkOAuthModal open={true} onOpenChange={mockOnOpenChange} />);
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Project ID is required')).toBeInTheDocument();
      expect(screen.getByText('Client name is required')).toBeInTheDocument();
    });
  });

  it('handles successful credential creation', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ credentials: [{ id: 'test' }] })
    });

    render(<BulkOAuthModal open={true} onOpenChange={mockOnOpenChange} />);

    await userEvent.type(screen.getByLabelText(/project id/i), 'test-project');
    await userEvent.type(screen.getByLabelText(/client name/i), 'test-client');
    await userEvent.type(screen.getByLabelText(/redirect uri/i), 'https://test.com/callback');
    await userEvent.type(screen.getByLabelText(/count/i), '2');

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Success'
        })
      );
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('handles API errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<BulkOAuthModal open={true} onOpenChange={mockOnOpenChange} />);

    await userEvent.type(screen.getByLabelText(/project id/i), 'test-project');
    await userEvent.type(screen.getByLabelText(/client name/i), 'test-client');
    await userEvent.type(screen.getByLabelText(/redirect uri/i), 'https://test.com/callback');
    await userEvent.type(screen.getByLabelText(/count/i), '2');

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'destructive'
        })
      );
    });
  });
});
