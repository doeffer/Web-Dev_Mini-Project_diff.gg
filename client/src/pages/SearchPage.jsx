import { useState } from 'react';
import { fetchSummoner } from '../api';
import SummonerCard from '../components/SummonerCard';

export default function SearchPage() {
  const [input, setInput] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setError(null);
    setData(null);

    const [gameName, tagLine] = input.trim().split('#');
    if (!gameName || !tagLine) {
      setError('Enter a valid Riot ID (e.g. PlayerName#EUW)');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchSummoner(gameName, tagLine);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>soerby.gg</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="GameName#TAG"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {data && <SummonerCard data={data} />}
    </main>
  );
}
