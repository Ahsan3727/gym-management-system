import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios.js';

export default function TrainerClients() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(searchParams.get('client') || '');
  const [clientProgress, setClientProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('workout'); // 'workout' | 'diet' | 'history'

  // Prescribe workout form
  const [workoutForm, setWorkoutForm] = useState({
    exercise: '',
    sets: '',
    reps: '',
    weight: '',
    durationMinutes: '',
    notes: '',
  });
  const [savingWorkout, setSavingWorkout] = useState(false);

  // Prescribe diet form
  const [dietForm, setDietForm] = useState({
    meal: '',
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
  });
  const [savingDiet, setSavingDiet] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadClients() {
    try {
      const { data } = await api.get('/trainer/clients');
      setClients(data);
      if (!selectedClientId && data.length > 0) {
        setSelectedClientId(data[0]._id);
      }
    } catch {
      setError('Could not load assigned clients.');
    } finally {
      setLoading(false);
    }
  }

  async function loadProgress(clientId) {
    if (!clientId) return;
    try {
      const { data } = await api.get(`/trainer/clients/${clientId}/progress`);
      setClientProgress(data);
    } catch {
      setError('Could not load client progress.');
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadProgress(selectedClientId);
      setSearchParams({ client: selectedClientId });
    }
  }, [selectedClientId]);

  async function handlePrescribeWorkout(e) {
    e.preventDefault();
    setSavingWorkout(true);
    setMessage('');
    setError('');
    try {
      await api.post(`/trainer/clients/${selectedClientId}/workouts`, workoutForm);
      setMessage(`Workout prescribed for ${clientProgress?.customer?.name}!`);
      setWorkoutForm({ exercise: '', sets: '', reps: '', weight: '', durationMinutes: '', notes: '' });
      await loadProgress(selectedClientId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not prescribe workout.');
    } finally {
      setSavingWorkout(false);
    }
  }

  async function handlePrescribeDiet(e) {
    e.preventDefault();
    setSavingDiet(true);
    setMessage('');
    setError('');
    try {
      await api.post(`/trainer/clients/${selectedClientId}/diet`, dietForm);
      setMessage(`Nutrition plan prescribed for ${clientProgress?.customer?.name}!`);
      setDietForm({ meal: '', calories: '', proteinG: '', carbsG: '', fatG: '' });
      await loadProgress(selectedClientId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not prescribe nutrition plan.');
    } finally {
      setSavingDiet(false);
    }
  }

  if (loading) return <div className="text-sm text-steel">Loading client studio…</div>;

  const currentClient = clientProgress?.customer || clients.find((c) => c._id === selectedClientId);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-ink">Client Training Studio</h1>
          <p className="text-sm text-steel">Prescribe customized workouts, assign nutrition plans, and track client metrics.</p>
        </div>

        {clients.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-steel">Active Client:</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="field-input py-1.5 text-xs font-medium"
            >
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.streak || 0}d streak)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <div className="mb-4 text-sm text-ember-dark">{error}</div>}
      {message && <div className="mb-4 text-sm text-chalk-dark">{message}</div>}

      {clients.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-steel">
          No clients are assigned to your trainer profile yet. Ask your gym admin to assign members.
        </div>
      ) : (
        <div>
          {/* Client summary pill */}
          <div className="panel mb-8 flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-steel">Client Profile</div>
              <div className="text-lg font-bold text-ink">{currentClient?.name}</div>
              <div className="text-xs text-steel mt-0.5">
                Goals: <strong>{currentClient?.goals || 'General Fitness'}</strong> • Phone: {currentClient?.phone || '—'}
              </div>
            </div>
            <div className="flex gap-6">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-steel">Attendance Streak</div>
                <div className="text-base font-semibold text-ember mt-0.5">
                  {clientProgress?.streak?.currentStreak || 0} Days 🔥
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-steel">Workouts Logged</div>
                <div className="text-base font-semibold text-ink mt-0.5">
                  {clientProgress?.workouts?.length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Action Tabs */}
          <div className="mb-6 flex gap-2 border-b border-ink/10 pb-2">
            <button
              onClick={() => setActiveTab('workout')}
              className={`rounded px-3 py-1.5 text-xs font-medium ${
                activeTab === 'workout' ? 'bg-iron text-white' : 'text-steel hover:text-ink'
              }`}
            >
              + Prescribe Workout
            </button>
            <button
              onClick={() => setActiveTab('diet')}
              className={`rounded px-3 py-1.5 text-xs font-medium ${
                activeTab === 'diet' ? 'bg-iron text-white' : 'text-steel hover:text-ink'
              }`}
            >
              + Prescribe Nutrition
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`rounded px-3 py-1.5 text-xs font-medium ${
                activeTab === 'history' ? 'bg-iron text-white' : 'text-steel hover:text-ink'
              }`}
            >
              View Client History
            </button>
          </div>

          {/* Tab 1: Prescribe Workout Form */}
          {activeTab === 'workout' && (
            <form onSubmit={handlePrescribeWorkout} className="panel p-6 mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="col-span-2">
                <label className="field-label">Exercise Name</label>
                <input
                  className="field-input"
                  placeholder="e.g. Barbell Deadlift, Incline Bench Press"
                  value={workoutForm.exercise}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, exercise: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="field-label">Target Sets</label>
                <input
                  type="number"
                  className="field-input"
                  placeholder="e.g. 4"
                  value={workoutForm.sets}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, sets: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Target Reps</label>
                <input
                  type="number"
                  className="field-input"
                  placeholder="e.g. 10"
                  value={workoutForm.reps}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, reps: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  className="field-input"
                  placeholder="e.g. 60"
                  value={workoutForm.weight}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, weight: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Duration (min)</label>
                <input
                  type="number"
                  className="field-input"
                  placeholder="e.g. 45"
                  value={workoutForm.durationMinutes}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, durationMinutes: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="field-label">Coach's Technique Notes</label>
                <input
                  className="field-input"
                  placeholder="e.g. Focus on chest up, slow eccentric descent"
                  value={workoutForm.notes}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                />
              </div>
              <div className="col-span-2 md:col-span-4 pt-2">
                <button type="submit" disabled={savingWorkout} className="btn-primary">
                  {savingWorkout ? 'Assigning…' : 'Assign Workout to Member'}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Prescribe Nutrition Form */}
          {activeTab === 'diet' && (
            <form onSubmit={handlePrescribeDiet} className="panel p-6 mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="col-span-2">
                <label className="field-label">Meal / Diet Recommendation</label>
                <input
                  className="field-input"
                  placeholder="e.g. Post-Workout Shake + Oats, Salmon & Sweet Potato"
                  value={dietForm.meal}
                  onChange={(e) => setDietForm({ ...dietForm, meal: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="field-label">Calories (kcal)</label>
                <input
                  type="number"
                  className="field-input"
                  placeholder="e.g. 650"
                  value={dietForm.calories}
                  onChange={(e) => setDietForm({ ...dietForm, calories: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Protein (g)</label>
                <input
                  type="number"
                  className="field-input"
                  placeholder="e.g. 45"
                  value={dietForm.proteinG}
                  onChange={(e) => setDietForm({ ...dietForm, proteinG: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Carbs (g)</label>
                <input
                  type="number"
                  className="field-input"
                  placeholder="e.g. 60"
                  value={dietForm.carbsG}
                  onChange={(e) => setDietForm({ ...dietForm, carbsG: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Fat (g)</label>
                <input
                  type="number"
                  className="field-input"
                  placeholder="e.g. 15"
                  value={dietForm.fatG}
                  onChange={(e) => setDietForm({ ...dietForm, fatG: e.target.value })}
                />
              </div>
              <div className="col-span-2 md:col-span-4 pt-2">
                <button type="submit" disabled={savingDiet} className="btn-primary">
                  {savingDiet ? 'Assigning…' : 'Assign Meal Plan to Member'}
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: History & Logged Activity */}
          {activeTab === 'history' && (
            <div className="grid gap-8 md:grid-cols-2">
              <div className="panel overflow-hidden">
                <div className="border-b border-ink/10 px-5 py-3 text-xs font-semibold text-steel uppercase tracking-wider">
                  Recent Workouts
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-ink/[0.02] border-b border-ink/5 text-left text-steel">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Exercise</th>
                      <th className="px-4 py-2">Sets × Reps</th>
                      <th className="px-4 py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientProgress?.workouts?.slice(0, 10).map((w) => (
                      <tr key={w._id} className="border-b border-ink/5 last:border-0">
                        <td className="px-4 py-2.5 text-steel">{new Date(w.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2.5 font-medium text-ink">{w.exercise}</td>
                        <td className="px-4 py-2.5 text-ink/70">
                          {w.sets && w.reps ? `${w.sets} × ${w.reps}` : '—'} {w.weight ? `(${w.weight}kg)` : ''}
                        </td>
                        <td className="px-4 py-2.5 text-steel">{w.notes || '—'}</td>
                      </tr>
                    ))}
                    {(!clientProgress?.workouts || clientProgress.workouts.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-steel">
                          No workouts recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="panel overflow-hidden">
                <div className="border-b border-ink/10 px-5 py-3 text-xs font-semibold text-steel uppercase tracking-wider">
                  Recent Nutrition Logs
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-ink/[0.02] border-b border-ink/5 text-left text-steel">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Meal</th>
                      <th className="px-4 py-2">Calories</th>
                      <th className="px-4 py-2">P / C / F</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientProgress?.diet?.slice(0, 10).map((d) => (
                      <tr key={d._id} className="border-b border-ink/5 last:border-0">
                        <td className="px-4 py-2.5 text-steel">{new Date(d.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2.5 font-medium text-ink">{d.meal}</td>
                        <td className="px-4 py-2.5 text-ink/70">{d.calories ? `${d.calories} kcal` : '—'}</td>
                        <td className="px-4 py-2.5 text-steel">
                          {d.macros?.proteinG ?? '—'}g / {d.macros?.carbsG ?? '—'}g / {d.macros?.fatG ?? '—'}g
                        </td>
                      </tr>
                    ))}
                    {(!clientProgress?.diet || clientProgress.diet.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-steel">
                          No diet entries logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
