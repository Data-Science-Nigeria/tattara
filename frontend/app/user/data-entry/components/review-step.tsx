'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, CheckCircle } from 'lucide-react';
interface ProcessingResult {
  data?: {
    firstName?: string;
    lastName?: string;
    age?: string;
    gender?: string;
    dateOfSymptoms?: string;
    testResults?: string;
    mosquitoSpecies?: string;
    symptoms?: string[];
  };
}

interface ReviewStepProps {
  result: ProcessingResult;
  onReset: () => void;
}

export function ReviewStep({ result, onReset }: ReviewStepProps) {
  const [formData, setFormData] = useState({
    firstName: result.data?.firstName || '',
    lastName: result.data?.lastName || '',
    age: result.data?.age || '',
    gender: result.data?.gender || '',
    dateOfSymptoms: result.data?.dateOfSymptoms || '',
    testResults: result.data?.testResults || '',
    mosquitoSpecies: result.data?.mosquitoSpecies || '',
    symptoms: result.data?.symptoms || [],
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSymptomChange = (symptom: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: checked
        ? [...prev.symptoms, symptom]
        : prev.symptoms.filter((s: string) => s !== symptom),
    }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const availableSymptoms = [
    'Headache',
    'Fever',
    'Drowsiness',
    'Body Weakness',
  ];

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">
            Submit Data
          </h1>
          <div className="h-px bg-gray-200"></div>
        </div>

        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Data Sent Successfully
          </h2>
          <p className="mb-6 text-gray-600">
            Your medical form has been processed and submitted.
          </p>
          <Button onClick={onReset} variant="outline">
            Process Another Form
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">
            Review Data
          </h1>
          <p className="text-gray-600">
            Verify and update the extracted information prior to submission.
          </p>
        </div>
        <Button
          onClick={onReset}
          variant="outline"
          className="border-green-600 bg-transparent text-green-600"
        >
          Reset Form
        </Button>
      </div>

      <div className="p-6">
        <div className="mb-6 grid grid-cols-2 gap-6">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleInputChange('gender', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dateOfSymptoms">Date of Start of Symptoms</Label>
            <div className="relative mt-1">
              <Input
                id="dateOfSymptoms"
                type="date"
                value={formData.dateOfSymptoms}
                onChange={(e) =>
                  handleInputChange('dateOfSymptoms', e.target.value)
                }
              />
              <Calendar className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            </div>
          </div>

          <div>
            <Label htmlFor="testResults">Test Results (if applicable)</Label>
            <Select
              value={formData.testResults}
              onValueChange={(value) => handleInputChange('testResults', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select test results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Positive">Positive</SelectItem>
                <SelectItem value="Negative">Negative</SelectItem>
                <SelectItem value="Unknown">Unknown</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-6">
          <Label htmlFor="mosquitoSpecies">
            Mosquito Species (if applicable)
          </Label>
          <Select
            value={formData.mosquitoSpecies}
            onValueChange={(value) =>
              handleInputChange('mosquitoSpecies', value)
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select mosquito species" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Aedes">Aedes</SelectItem>
              <SelectItem value="Anopheles">Anopheles</SelectItem>
              <SelectItem value="Culex">Culex</SelectItem>
              <SelectItem value="Mixed">Mixed</SelectItem>
              <SelectItem value="Unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Select Symptoms</Label>
          <div className="mt-2 space-y-2">
            {availableSymptoms.map((symptom) => (
              <div key={symptom} className="flex items-center space-x-2">
                <Checkbox
                  id={symptom}
                  checked={formData.symptoms.includes(symptom)}
                  onCheckedChange={(checked) =>
                    handleSymptomChange(symptom, checked as boolean)
                  }
                />
                <Label htmlFor={symptom} className="text-sm font-normal">
                  {symptom}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Submit Data
        </h2>
        <p className="mb-4 text-gray-600">
          Review your data and submit to the backend system.
        </p>

        <div className="bg-gray-50 p-4">
          <pre className="overflow-x-auto text-xs text-gray-700">
            {JSON.stringify(
              {
                events: [
                  {
                    occurredAt: formData.dateOfSymptoms,
                    notes: [],
                    program: 'uKMyG20YTGk',
                    orgUnit: 'DiszpKrYNg8',
                    dataValues: [
                      {
                        dataElement: 'UezIHP7jWKC',
                        value: formData.firstName,
                      },
                      {
                        dataElement: 'sYK4rOHjowV',
                        value: formData.lastName,
                      },
                    ],
                  },
                ],
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          className="border-green-600 bg-transparent text-green-600 hover:bg-green-50"
        >
          View Data in DHIS2
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-green-600 px-8 text-white hover:bg-green-700"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Data Sent Successfully
        </Button>
      </div>
    </div>
  );
}
