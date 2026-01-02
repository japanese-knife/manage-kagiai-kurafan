import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const generateSessionId = () => {
  const stored = localStorage.getItem('session_id');
  if (stored) return stored;

  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('session_id', newId);
  return newId;
};

export function useAccordionState(projectId: string, sectionName: string, defaultExpanded = true) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadAccordionState();
  }, [projectId, sectionName]);

  const loadAccordionState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = generateSessionId();

      const query = supabase
        .from('ui_preferences')
        .select('is_expanded')
        .eq('project_id', projectId)
        .eq('section_name', sectionName)
        .maybeSingle();

      if (user) {
        query.eq('user_id', user.id);
      } else {
        query.eq('session_id', sessionId);
      }

      const { data } = await query;

      if (data) {
        setIsExpanded(data.is_expanded);
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading accordion state:', error);
      setIsLoaded(true);
    }
  };

  const saveAccordionState = async (expanded: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = generateSessionId();

      const preferenceData: any = {
        project_id: projectId,
        section_name: sectionName,
        is_expanded: expanded,
        updated_at: new Date().toISOString(),
      };

      if (user) {
        preferenceData.user_id = user.id;
      } else {
        preferenceData.session_id = sessionId;
      }

      const { error } = await supabase
        .from('ui_preferences')
        .upsert(preferenceData, {
          onConflict: user ? 'user_id,project_id,section_name' : 'session_id,project_id,section_name',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving accordion state:', error);
    }
  };

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    saveAccordionState(newState);
  };

  const setExpandedWithSave = (expanded: boolean) => {
    setIsExpanded(expanded);
    saveAccordionState(expanded);
  };

  return {
    isExpanded,
    isLoaded,
    toggleExpanded,
    setExpandedWithSave,
  };
}
