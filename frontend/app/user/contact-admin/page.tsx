'use client';

import { useState } from 'react';
import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ContactAdminPage() {
  const [formData, setFormData] = useState({
    name: '',
    issue: '',
    comment: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormData({ name: '', issue: '', comment: '' });
  };

  const handleCancel = () => {
    setFormData({ name: '', issue: '', comment: '' });
  };

  return (
    <div className="relative min-h-screen p-3 sm:p-6">
      <div className="w-full">
        <div className="mb-6 px-0 sm:mb-8 sm:px-2">
          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            Contact Admin
          </h1>
        </div>

        <div className="px-0 sm:px-2">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg sm:max-w-lg sm:p-6 lg:max-w-2xl lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              <div className="space-y-2 sm:space-y-3">
                <Label
                  htmlFor="name"
                  className="text-base font-medium text-gray-700 sm:text-lg"
                >
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-12 text-base sm:h-14 sm:text-lg"
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label
                  htmlFor="issue"
                  className="text-base font-medium text-gray-700 sm:text-lg"
                >
                  Issue Type
                </Label>
                <Select
                  value={formData.issue}
                  onValueChange={(value) =>
                    setFormData({ ...formData, issue: value })
                  }
                >
                  <SelectTrigger className="h-10 text-sm sm:h-11 sm:text-base">
                    <SelectValue placeholder="Select the type of issue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="account">Account Issue</SelectItem>
                    <SelectItem value="workflow">Workflow Problem</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label
                  htmlFor="comment"
                  className="text-base font-medium text-gray-700 sm:text-lg"
                >
                  Description
                </Label>
                <Textarea
                  id="comment"
                  placeholder="Please provide detailed information about your issue or request..."
                  value={formData.comment}
                  onChange={(e) =>
                    setFormData({ ...formData, comment: e.target.value })
                  }
                  className="min-h-[120px] resize-none text-base sm:min-h-[150px] sm:text-lg lg:min-h-[180px]"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto p-2 text-base font-medium text-green-600 hover:bg-green-50 hover:text-green-700 sm:text-lg"
                >
                  <Paperclip className="mr-2 h-4 w-4 sm:mr-3 sm:h-5 sm:w-5" />
                  Add Attachment
                </Button>
                <span className="text-sm text-gray-500 sm:text-base">
                  Optional: Attach screenshots or relevant files
                </span>
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 pt-4 sm:flex-row sm:gap-4 sm:pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  className="text-muted-foreground hover:text-foreground h-10 text-sm font-medium sm:h-11 sm:text-base"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-10 bg-green-600 px-6 text-sm font-medium text-white hover:bg-green-700 sm:h-11 sm:px-8 sm:text-base"
                >
                  Send Message
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
