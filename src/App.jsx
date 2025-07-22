import React, { useState, useEffect } from 'react';
import { Loader, ChefHat, Sparkles, AlertTriangle, Send, Moon, Sun } from 'lucide-react';

export default function App() {
  const [ingredients, setIngredients] = useState('');
  const [mealType, setMealType] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');


  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if(savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  const handleGenerateRecipes = async () => {
    if (!ingredients.trim()) {
      setError("Please enter some ingredients to get started.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecipes([]);

    const prompt = `
      You are a creative chef. Based on the ingredients provided, generate 3 unique recipes.
      The user has: ${ingredients}.
      The desired meal type is: ${mealType}.

      Return the response as a JSON object. The object should have a single key "recipes" which is an array of recipe objects.
      Each recipe object should have:
      - "name"
      - "description"
      - "instructions" (as string, with steps separated by newlines)
    `;

    try {
      const payload = {
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      };

      const apiKey = "AIzaSyAoFoM2dxTylVX_zq6OUGcsyL0oq4eLs0c"; // replace with your key or environment
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

      const result = await response.json();

      if (result?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const jsonText = result.candidates[0].content.parts[0].text;
        const parsedData = JSON.parse(jsonText);
        const recipesWithIds = parsedData.recipes.map((r, i) => ({ ...r, id: Date.now() + i }));
        setRecipes(recipesWithIds);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Sorry, couldn't generate recipes. Please try again.");
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !isLoading) handleGenerateRecipes();
  };

  return (
    <div className="app-container">
      <div className="main">
        <div className="theme-toggle" onClick={toggleTheme} title='Toggle Theme'>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20}/>}
        </div>
        <header className="header">
          <div className="logo">
            <ChefHat size={40} />
            <h1>AI Recipe Generator</h1>
          </div>
          <p className="subtitle">What do you have in your kitchen today?</p>
        </header>

        <div className="input-card">
          <div className="input-grid">
            <div className="input-group">
              <label>Ingredients</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., eggs, tomatoes, cheese"
                />
                <Send onClick={handleGenerateRecipes} className="send-icon" />
              </div>
            </div>
            <div className="input-group">
              <label>Meal Type</label>
              <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
                <option>Any</option>
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Dinner</option>
                <option>Dessert</option>
              </select>
            </div>
          </div>
          <button onClick={handleGenerateRecipes} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="spinner" /> Generating...
              </>
            ) : (
              <>
                <Sparkles /> Generate Recipes
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="error">
            <AlertTriangle />
            <p>{error}</p>
          </div>
        )}

        {isLoading && recipes.length === 0 && (
          <div className="loading-card">
            <Loader className="spinner-lg" />
            <p>Thinking of delicious ideas...</p>
          </div>
        )}

        {!isLoading && recipes.length === 0 && !error && (
          <div className="placeholder">
            <p>Your AI-generated recipes will appear here.</p>
          </div>
        )}

        <div className="recipe-list">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="recipe-card">
              <h3>{recipe.name}</h3>
              <p className="desc">"{recipe.description}"</p>
              <h4>Instructions</h4>
              <div className="steps">
                {recipe.instructions.split('\n').map((step, idx) => (
                  <p key={idx}>{step}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
  )
}
