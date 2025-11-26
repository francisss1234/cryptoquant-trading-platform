import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarketPage from '../../pages/MarketPage';
import { MemoryRouter } from 'react-router-dom';

// Mock fetch API
global.fetch = vi.fn();

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('MarketPage', () => {
  const mockTradingPairs = [
    {
      id: 1,
      symbol: 'BTCUSDT',
      base_asset: 'BTC',
      quote_asset: 'USDT',
      exchange: 'binance',
      price: 50000,
      volume_24h: 1000000,
      high_24h: 51000,
      low_24h: 49000,
      change_24h: 1000,
      change_percent_24h: 2,
      status: 'TRADING',
      last_updated: '2023-01-01T00:00:00Z'
    },
    {
      id: 2,
      symbol: 'ETHUSDT',
      base_asset: 'ETH',
      quote_asset: 'USDT',
      exchange: 'coinbase',
      price: 3000,
      volume_24h: 500000,
      high_24h: 3100,
      low_24h: 2900,
      change_24h: 100,
      change_percent_24h: 3.33,
      status: 'TRADING',
      last_updated: '2023-01-01T00:00:00Z'
    }
  ];

  const mockApiResponse = {
    success: true,
    data: mockTradingPairs,
    pagination: {
      page: 1,
      limit: 50,
      total: 2,
      totalPages: 1
    },
    timestamp: '2023-01-01T00:00:00Z'
  };

  const mockCollectorStatus = {
    success: true,
    data: {
      health: { status: 'healthy' }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/trading-pairs')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockApiResponse)
        });
      }
      if (url.includes('/collector/status')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockCollectorStatus)
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('renders market page with trading pairs', async () => {
    render(
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    );

    // Check if page title is rendered
    expect(screen.getByText('交易市场')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
      expect(screen.getByText('ETHUSDT')).toBeInTheDocument();
    });
  });

  it('displays trading pair data correctly', async () => {
    render(
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check BTC trading pair data
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
      expect(screen.getByText('BTC/USDT')).toBeInTheDocument();
      expect(screen.getByText('BINANCE')).toBeInTheDocument();
      
      // Check ETH trading pair data
      expect(screen.getByText('ETHUSDT')).toBeInTheDocument();
      expect(screen.getByText('ETH/USDT')).toBeInTheDocument();
      expect(screen.getByText('COINBASE')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
    });

    // Find search input
    const searchInput = screen.getByPlaceholderText('搜索交易对...');
    
    // Type in search input
    await user.type(searchInput, 'BTC');

    // Verify search was applied (URL params should be updated)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=BTC')
      );
    });
  });

  it('handles exchange filter', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
    });

    // Find exchange select
    const exchangeSelect = screen.getByText('所有交易所');
    await user.click(exchangeSelect);

    // Select Binance
    const binanceOption = screen.getByText('Binance');
    await user.click(binanceOption);

    // Verify filter was applied
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('exchange=binance')
      );
    });
  });

  it('handles refresh functionality', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
    });

    // Find refresh button
    const refreshButton = screen.getByText('刷新');
    await user.click(refreshButton);

    // Verify refresh was triggered (fetch should be called again)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial load + status + refresh
    });
  });

  it('displays loading state', () => {
    // Mock slow response
    (global.fetch as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        json: () => Promise.resolve(mockApiResponse)
      }), 1000))
    );

    render(
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    );

    // Check loading state is shown
    expect(screen.getByText('加载交易对数据...')).toBeInTheDocument();
  });

  it('displays error state', async () => {
    // Mock API error
    (global.fetch as any).mockRejectedValue(new Error('API Error'));

    render(
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    );

    // Wait for error to be shown
    await waitFor(() => {
      expect(screen.getByText('获取交易对数据失败')).toBeInTheDocument();
    });
  });

  it('displays statistics correctly', async () => {
    render(
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
    });

    // Check statistics cards
    expect(screen.getByText('总交易对')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Total pairs
    expect(screen.getByText('当前页')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Current page
  });

  it('handles price formatting correctly', async () => {
    render(
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
    });

    // Check price formatting (BTC price should be formatted as 50000.00)
    expect(screen.getByText('50000.00')).toBeInTheDocument();
    
    // Check volume formatting (should be formatted as 1M)
    expect(screen.getByText('1M')).toBeInTheDocument();
  });

  it('handles percentage change display', async () => {
    render(
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
    });

    // Check positive change (should show +2.00%)
    expect(screen.getByText('2.00%')).toBeInTheDocument();
  });

  it('updates data automatically every 30 seconds', async () => {
    render(
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
    });

    // Fast-forward time by 30 seconds
    vi.advanceTimersByTime(30000);

    // Wait for automatic refresh
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(4); // Initial + status + 2 auto-refreshes
    });
  });

  it('handles data collector status display', async () => {
    render(
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('数据状态: 正常')).toBeInTheDocument();
    });
  });

  it('displays last update time', async () => {
    render(
      <MemoryRouter>
        <MarketPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Should show last update time
      expect(screen.getByText(/最后更新:/)).toBeInTheDocument();
    });
  });
});