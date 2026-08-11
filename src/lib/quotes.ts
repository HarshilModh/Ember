export interface QuoteItem {
  text: string;
  who: string;
  category?: "Focus" | "Systems" | "Mastery" | "Mindset";
}

export const QUOTES: QuoteItem[] = [
  { text: "Done is better than perfect.", who: "Sheryl Sandberg", category: "Focus" },
  { text: "The way to get started is to quit talking and begin doing.", who: "Walt Disney", category: "Focus" },
  { text: "It always seems impossible until it's done.", who: "Nelson Mandela", category: "Mindset" },
  { text: "Amateurs sit and wait for inspiration. The rest of us just get up and go to work.", who: "Stephen King", category: "Systems" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", who: "James Clear", category: "Systems" },
  { text: "Simplicity is the soul of efficiency.", who: "Austin Freeman", category: "Mastery" },
  { text: "What gets measured gets managed.", who: "Peter Drucker", category: "Systems" },
  { text: "Slow is smooth, and smooth is fast.", who: "Proverb", category: "Mastery" },
  { text: "The secret of getting ahead is getting started.", who: "Mark Twain", category: "Focus" },
  { text: "A year from now you may wish you had started today.", who: "Karen Lamb", category: "Mindset" },
  { text: "Focus is a matter of deciding what things you're not going to do.", who: "John Carmack", category: "Focus" },
  { text: "Perfection is achieved when there is nothing left to take away.", who: "Antoine de Saint-Exupéry", category: "Mastery" },
  { text: "Small daily improvements are the key to staggering long-term results.", who: "Robin Sharma", category: "Systems" },
  { text: "You can't build a reputation on what you are going to do.", who: "Henry Ford", category: "Focus" },
  { text: "Action is the foundational key to all success.", who: "Pablo Picasso", category: "Mindset" },
  { text: "Start where you are. Use what you have. Do what you can.", who: "Arthur Ashe", category: "Mindset" },
  { text: "Discipline equals freedom.", who: "Jocko Willink", category: "Systems" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", who: "Proverb", category: "Focus" },
  { text: "First, solve the problem. Then, write the code.", who: "John Johnson", category: "Mastery" },
  { text: "Motivation gets you going, habit keeps you growing.", who: "John Maxwell", category: "Systems" },
  { text: "Nothing will work unless you do.", who: "Maya Angelou", category: "Mindset" },
  { text: "Well begun is half done.", who: "Aristotle", category: "Focus" },
  { text: "Make it work, make it right, make it fast.", who: "Kent Beck", category: "Mastery" },
  { text: "Ambition is the path to success. Persistence is the vehicle you arrive in.", who: "Bill Bradley", category: "Mindset" },
  { text: "Great things are done by a series of small things brought together.", who: "Vincent van Gogh", category: "Systems" },
  { text: "If you spend too long thinking about a thing, you'll never get it done.", who: "Bruce Lee", category: "Focus" },
  { text: "Order your soul. Desire only that which is within you.", who: "Augustine", category: "Mindset" },
  { text: "The only way out is through.", who: "Robert Frost", category: "Mindset" },
  { text: "Courage is knowing what not to fear.", who: "Plato", category: "Mindset" },
  { text: "Little by little, one travels far.", who: "J. R. R. Tolkien", category: "Systems" },
  { text: "The obstacle is the way.", who: "Marcus Aurelius", category: "Mindset" },
  { text: "Work deeply, think clearly, and reject the noise.", who: "Cal Newport", category: "Focus" },
  { text: "Real artists ship.", who: "Steve Jobs", category: "Focus" },
  { text: "Simplicity requires hard work to achieve and appreciate.", who: "Edsger W. Dijkstra", category: "Mastery" },
];

export function quoteOfTheDay(now = new Date()): QuoteItem {
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return QUOTES[dayOfYear % QUOTES.length];
}

/** For break screens — a different quote each time, not the one already seen. */
export function randomQuote(exclude?: { text: string }): QuoteItem {
  const pool = exclude ? QUOTES.filter((q) => q.text !== exclude.text) : QUOTES;
  return pool[Math.floor(Math.random() * pool.length)];
}
