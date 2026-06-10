export const metrics = {
  ticketsOpenedToday: { value: 40,       delta: -31.03, invertDelta: true  },
  ticketsClosedToday: { value: 58,       delta:  13.73, invertDelta: false },
  ticketsPerHour:     { value: '2.56',   delta: -31.00, invertDelta: true  },
  ticketsPerDay:      { value: 40,       delta: -31.03, invertDelta: true  },
  responseTime:       { value: '0h 41m'                                    },
  resolutionTime:     { value: '36h 47m'                                   },
  totalTickets:       { value: 2647                                         },
  totalNew:           { value: 12                                           },
  totalClosed:        { value: 2569                                         },
  totalInProgress:    { value: 66                                           },
  techsOnline:        ['david.heerse@luminate.bank'],
  techsOOO:           [],
};

export const trendData = [
  { date: 'Jun 1',  opened: 52, closed: 48 },
  { date: 'Jun 2',  opened: 47, closed: 55 },
  { date: 'Jun 3',  opened: 38, closed: 42 },
  { date: 'Jun 4',  opened: 61, closed: 50 },
  { date: 'Jun 5',  opened: 44, closed: 60 },
  { date: 'Jun 6',  opened: 39, closed: 45 },
  { date: 'Jun 7',  opened: 33, closed: 38 },
  { date: 'Jun 8',  opened: 55, closed: 49 },
  { date: 'Jun 9',  opened: 40, closed: 58 },
  { date: 'Jun 10', opened: 48, closed: 52 },
  { date: 'Jun 11', opened: 36, closed: 41 },
  { date: 'Jun 12', opened: 42, closed: 47 },
  { date: 'Jun 13', opened: 50, closed: 44 },
  { date: 'Jun 14', opened: 40, closed: 58 },
];

export const statusData = [
  { name: 'New',         value: 12,   color: '#FBBF24' },
  { name: 'In Progress', value: 66,   color: '#7C3AED' },
  { name: 'Closed',      value: 2569, color: '#06B6D4' },
];

export const timeData = [
  { day: 'Mon', response: 0.6,  resolution: 32   },
  { day: 'Tue', response: 0.8,  resolution: 40   },
  { day: 'Wed', response: 0.5,  resolution: 28   },
  { day: 'Thu', response: 1.1,  resolution: 45   },
  { day: 'Fri', response: 0.7,  resolution: 36   },
  { day: 'Sat', response: 0.4,  resolution: 22   },
  { day: 'Sun', response: 0.65, resolution: 36.8 },
];

export const categoryData = [
  { name: 'IT Support',  count: 890 },
  { name: 'Finance',     count: 430 },
  { name: 'HR',          count: 375 },
  { name: 'Operations',  count: 290 },
  { name: 'Other',       count: 662 },
];
