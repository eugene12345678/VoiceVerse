import React from 'react';
import { motion } from 'framer-motion';
import {
  Rocket,
  Target,
  Users,
  Globe,
  Award,
  Zap,
  Brain,
  Shield,
  Code,
  Sparkles,
  MessageCircle,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const AboutPage = () => {
  const milestones = [
    {
      year: 2023,
      title: 'VoiceVerse Founded',
      description: 'Started with a vision to revolutionize voice technology'
    },
    {
      year: 2023,
      title: 'First Major Release',
      description: 'Launched our core voice transformation platform'
    },
    {
      year: 2024,
      title: 'Global Expansion',
      description: 'Reached users across 150+ countries'
    },
    {
      year: 2024,
      title: 'Innovation Award',
      description: 'Recognized for breakthrough AI technology'
    }
  ];

  const stats = [
    { icon: <Users />, value: '100K+', label: 'Active Users' },
    { icon: <Globe />, value: '150+', label: 'Countries' },
    { icon: <Zap />, value: '5M+', label: 'Transformations' },
    { icon: <Award />, value: '15+', label: 'Awards' }
  ];

  return (
    <div className="min-h-screen bg-gradient-mesh dark:bg-dark-950">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-dark-900 dark:text-white mb-4">
              Transforming Voice Technology
            </h1>
            <p className="text-xl text-dark-600 dark:text-dark-400 max-w-2xl mx-auto">
              VoiceVerse is revolutionizing the way we interact with voice technology,
              making professional-grade voice transformation accessible to everyone.
            </p>
          </motion.div>
        </div>

        {/* Vision Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                  <Rocket className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-display font-bold text-dark-900 dark:text-white">
                  Our Vision
                </h2>
              </div>
              <p className="text-dark-600 dark:text-dark-400 mb-6">
                At VoiceVerse, we envision a world where voice technology breaks down
                barriers and enables everyone to express themselves authentically.
                Our mission is to democratize voice AI technology and make it accessible
                to creators worldwide.
              </p>
              <div className="space-y-4">
                {[
                  'Revolutionize voice technology',
                  'Empower content creators',
                  'Drive innovation in AI',
                  'Build a global community'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    <span className="text-dark-700 dark:text-dark-300">{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative h-full">
              <img
                src="https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Vision"
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl" />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="text-white space-y-2">
                  <h3 className="text-2xl font-display font-bold">
                    The Future of Voice
                  </h3>
                  <p className="text-white/80">
                    Building the next generation of voice technology with AI
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-dark-600 dark:text-dark-400">
                  {stat.label}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Founder Section */}
        <div className="mb-16">
          <Card className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900 dark:text-white mb-4">
                  Meet the Founder
                </h2>
                <p className="text-dark-600 dark:text-dark-400 mb-6">
                  Eugene Mathenge is a passionate developer and innovator in the field
                  of voice technology. With a background in AI and software engineering,
                  he founded VoiceVerse with the vision of making advanced voice
                  transformation accessible to everyone.
                </p>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    <span className="text-dark-700 dark:text-dark-300">
                      AI & Machine Learning Expert
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Code className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    <span className="text-dark-700 dark:text-dark-300">
                      Full Stack Developer
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    <span className="text-dark-700 dark:text-dark-300">
                      Voice Technology Innovator
                    </span>
                  </div>
                </div>
                <Button
                  leftIcon={<MessageCircle className="h-5 w-5" />}
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  Connect with Eugene
                </Button>
              </div>
              <div className="relative">
                <img
                  src="./Eugene.jpeg"
                  alt="Eugene Mathenge"
                  className="w-full rounded-xl"
                />
                <div className="absolute -bottom-4 -right-4 bg-white dark:bg-dark-800 p-4 rounded-lg shadow-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    <span className="font-medium text-dark-900 dark:text-white">
                      Founder & Lead Developer
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Timeline */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900 dark:text-white text-center mb-8">
            Our Journey
          </h2>
          <div className="max-w-3xl mx-auto">
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative pl-8 pb-8 last:pb-0"
              >
                <div className="absolute left-0 top-0 w-px h-full bg-primary-200 dark:bg-primary-800" />
                <div className="absolute left-0 top-0 w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400 -translate-x-1/2" />
                <div className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow-lg">
                  <div className="text-primary-600 dark:text-primary-400 font-bold mb-2">
                    {milestone.year}
                  </div>
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
                    {milestone.title}
                  </h3>
                  <p className="text-dark-600 dark:text-dark-400">
                    {milestone.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="p-8 md:p-12 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Join the Voice Revolution
            </h2>
            <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
              Be part of the future of voice technology. Start creating amazing
              voice content with VoiceVerse today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-primary-600 hover:bg-primary-50"
                leftIcon={<Sparkles className="h-5 w-5" />}
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
                leftIcon={<MessageCircle className="h-5 w-5" />}
              >
                Contact Us
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};