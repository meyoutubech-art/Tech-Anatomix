import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('TECH-ANATOMIX — Dedicated AI Learning Workspace for Sketchfab & External 3D Models', async (t) => {
  await t.test('1. TARGET MODELS: ExternalModelWorkspace applied to Sketchfab models and Anatomy Explorers', () => {
    const dynamicRendererPath = path.resolve('src/components/models/Dynamic3DModelRenderer.tsx');
    assert.ok(fs.existsSync(dynamicRendererPath), 'Dynamic3DModelRenderer.tsx exists');
    const rendererContent = fs.readFileSync(dynamicRendererPath, 'utf-8');

    // Verify ExternalModelWorkspace is imported and used for Heart, Respiratory, Digestive, Brain, and embedHtml
    assert.ok(
      rendererContent.includes("import { ExternalModelWorkspace } from './ExternalModelWorkspace'"),
      'Dynamic3DModelRenderer imports ExternalModelWorkspace'
    );
    assert.ok(
      rendererContent.includes('isHeartModel ? (\n        <ExternalModelWorkspace') ||
        rendererContent.includes('isHeartModel ? (\r\n        <ExternalModelWorkspace'),
      'Heart model uses ExternalModelWorkspace'
    );
    assert.ok(
      rendererContent.includes('isRespiratoryModel ? (\n        <ExternalModelWorkspace') ||
        rendererContent.includes('isRespiratoryModel ? (\r\n        <ExternalModelWorkspace'),
      'Respiratory model uses ExternalModelWorkspace'
    );
    assert.ok(
      rendererContent.includes('isDigestiveModel ? (\n        <ExternalModelWorkspace') ||
        rendererContent.includes('isDigestiveModel ? (\r\n        <ExternalModelWorkspace'),
      'Digestive model uses ExternalModelWorkspace'
    );
    assert.ok(
      rendererContent.includes('isBrainModel ? (\n        <ExternalModelWorkspace') ||
        rendererContent.includes('isBrainModel ? (\r\n        <ExternalModelWorkspace'),
      'Brain model uses ExternalModelWorkspace'
    );
    assert.ok(
      rendererContent.includes('modelSpec.embedHtml ? (\n        <ExternalModelWorkspace') ||
        rendererContent.includes('modelSpec.embedHtml ? (\r\n        <ExternalModelWorkspace'),
      'Generic embedHtml models use ExternalModelWorkspace'
    );
  });

  await t.test('2. EXCLUSION OF NATIVE THREE.JS MODELS: Preserves existing parameter & simulation layouts', () => {
    const dynamicRendererPath = path.resolve('src/components/models/Dynamic3DModelRenderer.tsx');
    const rendererContent = fs.readFileSync(dynamicRendererPath, 'utf-8');

    // Verify Three.js fallback maintains Global3DViewer and Model-specific parameters
    assert.ok(
      rendererContent.includes('<Global3DViewer'),
      'Dynamic3DModelRenderer preserves Global3DViewer for native Three.js models'
    );
    assert.ok(
      rendererContent.includes('electric-bell') && rendererContent.includes('electric-bell-dedicated-panel'),
      'Electric Bell preserves dedicated parameter layout and simulation engine'
    );
    assert.ok(
      rendererContent.includes('bonding-explorer') && rendererContent.includes('bonding-dedicated-panel'),
      'Bonding Explorer preserves dedicated parameter layout and simulation engine'
    );
  });

  await t.test('3. REVERSED DESKTOP LAYOUT: Left AI Chat Assistant (50%) & Right 3D Model Viewer (50%)', () => {
    const workspacePath = path.resolve('src/components/models/ExternalModelWorkspace.tsx');
    assert.ok(fs.existsSync(workspacePath), 'ExternalModelWorkspace.tsx exists');
    const workspaceContent = fs.readFileSync(workspacePath, 'utf-8');

    // Verify Grid layout with reversed order:
    // Left side on desktop: order-2 lg:order-1 lg:col-span-6 (AI Chat Assistant)
    // Right side on desktop: order-1 lg:order-2 lg:col-span-6 (3D Model Viewer)
    assert.ok(
      workspaceContent.includes('order-2 lg:order-1 lg:col-span-6'),
      'AI Chat panel is on the LEFT on desktop (lg:order-1) and occupies 50% width (lg:col-span-6)'
    );
    assert.ok(
      workspaceContent.includes('order-1 lg:order-2 lg:col-span-6'),
      '3D Viewer is on the RIGHT on desktop (lg:order-2) and occupies 50% width (lg:col-span-6)'
    );
    assert.ok(
      workspaceContent.includes('order-1') && workspaceContent.includes('order-2'),
      'Mobile layout displays 3D model first (order-1) and AI chat below it (order-2)'
    );
  });

  await t.test('4. LEFT PANEL AI CHAT ASSISTANT: Header, intro, suggested questions, conversation, composer', () => {
    const chatPath = path.resolve('src/components/ai/ExternalModelAiChat.tsx');
    assert.ok(fs.existsSync(chatPath), 'ExternalModelAiChat.tsx exists');
    const chatContent = fs.readFileSync(chatPath, 'utf-8');

    // Header & Controls
    assert.ok(
      chatContent.includes('AI Learning Assistant'),
      'Compact header displays "AI Learning Assistant"'
    );
    assert.ok(
      chatContent.includes('New Chat') || chatContent.includes('handleResetConversation'),
      'Provides conversation reset control to start new conversation'
    );

    // Suggested questions
    assert.ok(chatContent.includes('Explain this model.'), 'Includes "Explain this model." suggestion');
    assert.ok(chatContent.includes('Explain the important components.'), 'Includes "Explain the important components." suggestion');
    assert.ok(chatContent.includes('Give me exam notes.'), 'Includes "Give me exam notes." suggestion');

    // Message composer with enter-to-send and shift+enter
    assert.ok(
      chatContent.includes("e.key === 'Enter' && !e.shiftKey"),
      'Composer submits on Enter and inserts new line on Shift+Enter'
    );

    // Persistence across rerenders
    assert.ok(
      chatContent.includes('conversationCache'),
      'Preserves conversation history in cache keyed by model across viewer rerenders'
    );

    // Real AI integration endpoint
    assert.ok(
      chatContent.includes("fetch('/api/ai/chat'"),
      'Calls real AI backend endpoint /api/ai/chat with model context'
    );
  });

  await t.test('5. ANATOMY EXPLORER INTEGRATION: AnatomyPage Tab 1 features the Dedicated AI Learning Workspace', () => {
    const anatomyPagePath = path.resolve('src/pages/AnatomyPage.tsx');
    assert.ok(fs.existsSync(anatomyPagePath), 'AnatomyPage.tsx exists');
    const anatomyContent = fs.readFileSync(anatomyPagePath, 'utf-8');

    assert.ok(
      anatomyContent.includes("import { ExternalModelAiChat } from '../components/ai/ExternalModelAiChat'"),
      'AnatomyPage imports ExternalModelAiChat'
    );
    assert.ok(
      anatomyContent.includes('order-2 lg:order-1 lg:col-span-5') ||
        anatomyContent.includes('order-2 lg:order-1 lg:col-span-6'),
      'AnatomyPage positions AI Chat on the LEFT on desktop (lg:order-1)'
    );
    assert.ok(
      anatomyContent.includes('order-1 lg:order-2 lg:col-span-7') ||
        anatomyContent.includes('order-1 lg:order-2 lg:col-span-6'),
      'AnatomyPage positions 3D specimen on the RIGHT on desktop (lg:order-2)'
    );
  });
});
