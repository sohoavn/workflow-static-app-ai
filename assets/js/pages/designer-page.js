/**
 * Designer Page Controller
 * Handles AI-powered workflow generation with Gemini
 */

import GeminiClient from '../core/gemini-client.js';
import APIKeyManager from '../core/api-key-manager.js';
import StorageManager from '../core/storage-manager.js';
import FileHandler from '../utils/file-handler.js';

class DesignerPage {
  constructor() {
    this.apiKeyManager = new APIKeyManager();
    this.geminiClient = new GeminiClient(this.apiKeyManager);
    this.storageManager = new StorageManager();
    this.fileHandler = new FileHandler();
    
    this.currentWorkflow = null;
    this.currentExpert = 'education';
    this.chatHistory = [];
    
    this.init();
  }

  async init() {
    console.log('🎨 Initializing Designer Page');
    
    // Check if API keys exist
    if (this.apiKeyManager.getAllKeys().length === 0) {
      this.showNoKeysWarning();
    }
    
    this.attachEventListeners();
    this.updateExpertDescription();
  }

  showNoKeysWarning() {
    const warning = document.createElement('div');
    warning.className = 'bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-6 mt-4';
    warning.innerHTML = `
      <div class="flex">
        <div class="flex-shrink-0">
          <i data-lucide="alert-triangle" class="w-5 h-5 text-yellow-400"></i>
        </div>
        <div class="ml-3">
          <p class="text-sm text-yellow-700">
            <strong>No API keys configured.</strong> 
            Please add at least one Gemini API key in 
            <a href="#settings" class="underline font-medium">Settings</a> 
            to use the AI assistant.
          </p>
        </div>
      </div>
    `;
    
    document.querySelector('.designer-page').insertBefore(
      warning, 
      document.querySelector('.flex.overflow-hidden')
    );
    
    if (window.lucide) lucide.createIcons();
  }

  attachEventListeners() {
    // Expert selector
    document.getElementById('expert-selector').addEventListener('change', (e) => {
      this.currentExpert = e.target.value;
      this.updateExpertDescription();
    });

    // Chat form
    document.getElementById('chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.generateWorkflow();
    });

    // Clear chat
    document.getElementById('btn-clear-chat').addEventListener('click', () => {
      this.clearChat();
    });

    // Use example
    document.getElementById('btn-use-example').addEventListener('click', () => {
      this.useExample();
    });

    // Regenerate
    document.getElementById('btn-regenerate').addEventListener('click', () => {
      this.regenerateWorkflow();
    });

    // View JSON
    document.getElementById('btn-view-json').addEventListener('click', () => {
      this.viewJSON();
    });

    // Save workflow
    document.getElementById('btn-save-workflow').addEventListener('click', () => {
      this.saveWorkflow();
    });

    // Export JSON
    document.getElementById('btn-export-json').addEventListener('click', () => {
      this.exportWorkflow();
    });

    // Modal close buttons
    document.getElementById('btn-close-modal')?.addEventListener('click', () => {
      document.getElementById('step-editor-modal').style.display = 'none';
    });

    document.getElementById('btn-close-json-modal')?.addEventListener('click', () => {
      document.getElementById('json-viewer-modal').style.display = 'none';
    });

    document.getElementById('btn-copy-json')?.addEventListener('click', () => {
      this.copyJSON();
    });
    
    console.log('✅ Designer event listeners attached');
  }

  updateExpertDescription() {
    const descriptions = {
      education: 'Specialized in education workflows (enrollment, exams, grading)',
      hr: 'Expert in HR processes (onboarding, leave requests, performance reviews)',
      sales: 'Focused on sales & marketing (lead management, campaigns, deals)',
      finance: 'Specialized in finance operations (invoicing, budgets, expenses)',
      operations: 'Expert in operations (order fulfillment, inventory, quality control)',
      custom: 'General purpose workflow assistant - describe your specific needs'
    };

    document.getElementById('expert-description').textContent = descriptions[this.currentExpert] || '';
  }

  async generateWorkflow() {
    const input = document.getElementById('chat-input');
    const userMessage = input.value.trim();

    if (!userMessage) return;

    // Check API keys
    if (!this.apiKeyManager.hasAvailableKeys()) {
      window.notificationManager.error('No API keys available. Please add keys in Settings.');
      return;
    }

    // Add user message to chat
    this.addChatMessage(userMessage, 'user');
    input.value = '';

    // Store in history
    this.chatHistory.push(userMessage);

    // Show loading
    const loadingId = this.addChatMessage('Generating workflow...', 'assistant', true);
    document.getElementById('btn-generate').disabled = true;

    try {
      // Build prompt based on expert domain
      const prompt = this.buildPrompt(userMessage);

      // Generate with streaming
      let fullResponse = '';
      await this.geminiClient.generateContentStream(
        prompt,
        (chunk) => {
          fullResponse += chunk;
          this.updateChatMessage(loadingId, fullResponse);
        },
        'gemini-1.5-pro'
      );

      // Parse workflow from response
      this.parseAndDisplayWorkflow(fullResponse);

      // Show regenerate button
      document.getElementById('btn-regenerate').style.display = 'inline-flex';

    } catch (error) {
      console.error('Generation failed:', error);
      this.updateChatMessage(loadingId, `❌ Error: ${error.message}`, false);
      window.notificationManager.error('Failed to generate workflow: ' + error.message);
    } finally {
      document.getElementById('btn-generate').disabled = false;
    }
  }

  buildPrompt(userMessage) {
    const expertPrompts = {
      education: `You are an education workflow expert. Create a detailed workflow for: ${userMessage}

Design for Vietnamese education context with roles like Teachers, Students, Parents, Principal.`,
      
      hr: `You are an HR/Admin expert. Create a detailed workflow for: ${userMessage}

Follow Vietnamese labor laws and include proper approval chains.`,
      
      sales: `You are a Sales/Marketing expert. Create a detailed workflow for: ${userMessage}

Focus on lead conversion, ROI tracking, and multi-channel coordination.`,
      
      finance: `You are a Finance expert. Create a detailed workflow for: ${userMessage}

Include approval thresholds, audit trails, and compliance checks.`,
      
      operations: `You are an Operations expert. Create a detailed workflow for: ${userMessage}

Focus on process efficiency, resource allocation, and quality control.`,
      
      custom: `Create a detailed workflow for: ${userMessage}

Analyze the domain and design an appropriate workflow.`
    };

    const basePrompt = expertPrompts[this.currentExpert] || expertPrompts.custom;

    return `${basePrompt}

IMPORTANT: Generate a valid JSON workflow following this exact structure:

\`\`\`json
{
  "id": "wf_unique_id",
  "name": "Workflow Name",
  "description": "Brief description",
  "industry": "${this.currentExpert}",
  "version": "1.0",
  "created_at": "${new Date().toISOString()}",
  "steps": [
    {
      "step_id": "step_1",
      "order": 1,
      "name": "Step Name",
      "type": "form",
      "description": "What happens in this step",
      "responsible": "Role name",
      "estimated_time": "X days",
      "form_fields": [
        {
          "field_id": "field_1",
          "label": "Field Label",
          "type": "text",
          "required": true,
          "validation": "validation rule"
        }
      ],
      "next_step_conditions": [
        {
          "condition": "all_fields_complete",
          "next_step": "step_2"
        }
      ]
    }
  ]
}
\`\`\`

Make sure the JSON is valid and complete. Include 3-5 steps minimum.`;
  }

  parseAndDisplayWorkflow(response) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const jsonStr = jsonMatch[1];
      const workflow = JSON.parse(jsonStr);

      // Validate workflow structure
      if (!workflow.id || !workflow.name || !workflow.steps) {
        throw new Error('Invalid workflow structure');
      }

      this.currentWorkflow = workflow;
      this.renderWorkflowPreview(workflow);

      // Enable buttons
      document.getElementById('btn-view-json').disabled = false;
      document.getElementById('btn-save-workflow').disabled = false;
      document.getElementById('btn-export-json').disabled = false;

      window.notificationManager.success('Workflow generated successfully!');

    } catch (error) {
      console.error('Failed to parse workflow:', error);
      window.notificationManager.error('Failed to parse workflow. Please try regenerating.');
    }
  }

  renderWorkflowPreview(workflow) {
    // Hide empty state
    document.getElementById('preview-empty').style.display = 'none';
    document.getElementById('workflow-content').style.display = 'block';

    // Render metadata
    const metadata = document.getElementById('workflow-metadata');
    metadata.innerHTML = `
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h3 class="text-lg font-bold text-gray-900">${workflow.name}</h3>
        <p class="text-sm text-gray-600 mt-1">${workflow.description || ''}</p>
        <div class="flex gap-4 mt-3 text-xs text-gray-600">
          <span>📋 ${workflow.steps.length} steps</span>
          <span>🏢 ${workflow.industry}</span>
          <span>📅 v${workflow.version}</span>
        </div>
      </div>
    `;

    // Render steps
    const stepsContainer = document.getElementById('workflow-steps');
    stepsContainer.innerHTML = workflow.steps.map((step, index) => `
      <div class="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onclick="window.designerPage.editStep('${step.step_id}')">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                ${step.order}
              </span>
              <h4 class="font-semibold text-gray-900">${step.name}</h4>
              <span class="badge badge-primary text-xs">${step.type}</span>
            </div>
            
            <p class="text-sm text-gray-600 mt-2 ml-8">${step.description}</p>
            
            <div class="flex gap-4 mt-3 ml-8 text-xs text-gray-500">
              <span>👤 ${step.responsible}</span>
              <span>⏱️ ${step.estimated_time}</span>
              ${step.form_fields ? `<span>📝 ${step.form_fields.length} fields</span>` : ''}
            </div>
          </div>
          
          <button class="text-gray-400 hover:text-gray-600">
            <i data-lucide="edit" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
  }

  addChatMessage(message, role, isLoading = false) {
    const container = document.getElementById('chat-messages');
    const messageId = `msg-${Date.now()}`;

    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    messageDiv.innerHTML = `
      <div class="max-w-[80%] ${role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'} rounded-lg px-4 py-3">
        ${isLoading ? '<div class="animate-pulse">Generating...</div>' : `<div class="text-sm whitespace-pre-wrap">${this.escapeHtml(message)}</div>`}
      </div>
    `;

    // Remove welcome message if exists
    const welcome = container.querySelector('.text-center.py-12');
    if (welcome) {
      welcome.remove();
    }

    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;

    return messageId;
  }

  updateChatMessage(messageId, content, removeLoading = true) {
    const messageDiv = document.getElementById(messageId);
    if (messageDiv) {
      const contentDiv = messageDiv.querySelector('div > div');
      if (contentDiv) {
        contentDiv.innerHTML = this.escapeHtml(content);
        if (removeLoading) {
          contentDiv.classList.remove('animate-pulse');
        }
      }
    }
  }

  clearChat() {
    if (confirm('Clear chat history?')) {
      const container = document.getElementById('chat-messages');
      container.innerHTML = `
        <div class="text-center text-gray-500 py-12">
          <i data-lucide="message-circle" class="w-12 h-12 mx-auto mb-4 text-gray-400"></i>
          <p class="font-medium">Start by describing your workflow...</p>
          <p class="text-sm mt-2">Example: "Create an employee onboarding workflow"</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      this.chatHistory = [];
    }
  }

  useExample() {
    const examples = {
      education: 'Create a student enrollment workflow for a university with document verification, fee payment, and course registration',
      hr: 'Design an employee onboarding process with document collection, IT setup, and orientation training',
      sales: 'Build a lead qualification workflow with scoring, follow-up tasks, and deal approval process',
      finance: 'Create an invoice approval workflow with multi-level authorization based on amount thresholds',
      operations: 'Design an order fulfillment process with inventory check, packing, quality control, and shipping',
      custom: 'Create a project approval workflow with proposal submission, review, budget allocation, and execution'
    };

    document.getElementById('chat-input').value = examples[this.currentExpert] || examples.custom;
  }

  regenerateWorkflow() {
    const lastMessage = this.chatHistory[this.chatHistory.length - 1];
    if (lastMessage) {
      document.getElementById('chat-input').value = lastMessage;
      this.generateWorkflow();
    }
  }

  viewJSON() {
    if (!this.currentWorkflow) return;

    const modal = document.getElementById('json-viewer-modal');
    const content = document.getElementById('json-content');
    
    content.textContent = JSON.stringify(this.currentWorkflow, null, 2);
    modal.style.display = 'flex';
  }

  async copyJSON() {
    if (!this.currentWorkflow) return;

    const json = JSON.stringify(this.currentWorkflow, null, 2);
    const success = await this.fileHandler.copyToClipboard(json);
    
    if (success) {
      window.notificationManager.success('JSON copied to clipboard');
    } else {
      window.notificationManager.error('Failed to copy JSON');
    }
  }

  async saveWorkflow() {
    if (!this.currentWorkflow) return;

    try {
      await this.storageManager.save(
        this.currentWorkflow.id,
        this.currentWorkflow,
        'workflows'
      );
      
      window.notificationManager.success('Workflow saved to library');
    } catch (error) {
      window.notificationManager.error('Failed to save: ' + error.message);
    }
  }

  exportWorkflow() {
    if (!this.currentWorkflow) return;

    const filename = this.fileHandler.generateSafeFilename(
      this.currentWorkflow.name,
      '.json'
    );

    this.fileHandler.downloadJSON(this.currentWorkflow, filename);
    window.notificationManager.success('Workflow exported');
  }

  editStep(stepId) {
    window.notificationManager.info('Step editor coming soon!');
    // TODO: Implement step editor in Wave 2
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export to window for global access
window.DesignerPage = DesignerPage;

// Auto-init if already on designer page
if (document.getElementById('chat-form')) {
  console.log('📄 Designer form present, initializing immediately');
  window.designerPage = new DesignerPage();
} else {
  console.log('⏳ Designer form not present yet, will init on page load');
}
