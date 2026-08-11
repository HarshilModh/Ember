/**
 * Static list, no network call. Picked by date so it changes once a day rather
 * than on every render — a quote that flickers as you navigate is noise.
 */
export const QUOTES: { text: string; who: string }[] = [
  { text: "Done is better than perfect.", who: "Sheryl Sandberg" },
  { text: "The way to get started is to quit talking and begin doing.", who: "Walt Disney" },
  { text: "It always seems impossible until it's done.", who: "Nelson Mandela" },
  { text: "Amateurs sit and wait for inspiration. The rest of us just get up and go to work.", who: "Stephen King" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", who: "James Clear" },
  { text: "Simplicity is the soul of efficiency.", who: "Austin Freeman" },
  { text: "What gets measured gets managed.", who: "Peter Drucker" },
  { text: "Slow is smooth, and smooth is fast.", who: "proverb" },
  { text: "The secret of getting ahead is getting started.", who: "Mark Twain" },
  { text: "A year from now you may wish you had started today.", who: "Karen Lamb" },
  { text: "Focus is a matter of deciding what things you're not going to do.", who: "John Carmack" },
  { text: "Perfection is achieved when there is nothing left to take away.", who: "Antoine de Saint-Exupéry" },
  { text: "Small daily improvements are the key to staggering long-term results.", who: "Robin Sharma" },
  { text: "You can't build a reputation on what you are going to do.", who: "Henry Ford" },
  { text: "Action is the foundational key to all success.", who: "Pablo Picasso" },
  { text: "Start where you are. Use what you have. Do what you can.", who: "Arthur Ashe" },
  { text: "Discipline equals freedom.", who: "Jocko Willink" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", who: "proverb" },
  { text: "First, solve the problem. Then, write the code.", who: "John Johnson" },
  { text: "Motivation gets you going, habit keeps you growing.", who: "John Maxwell" },
  { text: "Nothing will work unless you do.", who: "Maya Angelou" },
  { text: "Well begun is half done.", who: "Aristotle" },
  { text: "Make it work, make it right, make it fast.", who: "Kent Beck" },
  { text: "Ambition is the path to success. Persistence is the vehicle you arrive in.", who: "Bill Bradley" },
  { text: "Great things are done by a series of small things brought together.", who: "Vincent van Gogh" },
  { text: "If you spend too long thinking about a thing, you'll never get it done.", who: "Bruce Lee" },
  { text: "Order your soul. Desire only that which is within you.", who: "Augustine" },
  { text: "The only way out is through.", who: "Robert Frost" },
  { text: "Courage is knowing what not to fear.", who: "Plato" },
  { text: "Little by little, one travels far.", who: "J. R. R. Tolkien" },
  { text: "The obstacle is the way.", who: "Marcus Aurelius" },
];

export function quoteOfTheDay(now = new Date()) {
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return QUOTES[dayOfYear % QUOTES.length];
}

/** For break screens — a different quote each time, not the one already seen today. */
export function randomQuote(exclude?: { text: string }) {
  const pool = exclude ? QUOTES.filter((q) => q.text !== exclude.text) : QUOTES;
  return pool[Math.floor(Math.random() * pool.length)];
}
