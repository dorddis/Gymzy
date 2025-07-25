'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { SVGProps } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Muscle, MUSCLE_VOLUME_THRESHOLDS } from '@/lib/constants';
import { RotateCcw } from 'lucide-react';

import FrontFullBody from '@/assets/images/front-full-body-with-all-muscles-showing.svg';
import BackFullBody from '@/assets/images/back-full-body-with-all-muscles-showing.svg';

interface MuscleActivationSVGProps {
  muscleVolumes?: Partial<Record<Muscle, number>>;
  className?: string;
  scrollElementRef?: React.RefObject<HTMLElement>;
  scale?: number;
}

/**
 * Given a numeric volume, return activation level + Tailwind‐class color.
 */
const getMuscleActivationLevel = (
  volume: number | undefined
): { level: 'Low' | 'Medium' | 'High' | 'None'; opacity: number } => {
  if (volume === undefined || volume === 0) {
    return { level: 'None', opacity: 0 };
  }
  if (volume < MUSCLE_VOLUME_THRESHOLDS.LOW) {
    return { level: 'Low', opacity: 0.3 };
  }
  if (volume < MUSCLE_VOLUME_THRESHOLDS.MEDIUM) {
    return { level: 'Medium', opacity: 0.6 };
  }
  return { level: 'High', opacity: 1.0 };
};

/**
 * Map from Muscle enum → one or more `<g id="...">` strings
 * for the *back*‐view SVG.  Each key is a Muscle enum, and each RHS is
 * either a single string (one `<g>`) or an array of strings (if the
 * "muscle" is actually split into multiple sub‐IDs in the SVG).
 */
const backMuscleIdMap: Partial<Record<Muscle, string | string[]>> = {
  [Muscle.Rhomboids]: 'Rhomboid_major_00000153702420119838252620000014513967375993411263_',
  [Muscle.Hamstrings]: [
    'Semimembranosis_00000165197940537239056910000018339456362161962915_',
    'Semi_Tendinosis_00000142172608923587160350000008002679039365734793_',
    'Upper_inner_hamstring_00000155141996103184447130000003953608675083121284_',
    'Biceps_Femoris_00000110447600570690947540000000638541115458994341_',
  ],
  [Muscle.Trapezius]: 'Trapz_00000086658569290832975040000006959360490215844261_',
  [Muscle.LowerTrapezius]: 'Middle_and_lower_trapz_00000011030372104423980000000004308217814190120081_',
  [Muscle.LatissimusDorsi]: 'Lats_00000133492815442984477070000001790843316009520005_',
  [Muscle.Deltoid]: 'Delts_00000037683310307467639390000007902456789317736638_',
  [Muscle.TeresMajor]: 'Teres_Major_00000116932973775553672460000017841647355507566270_',
  [Muscle.Infraspinatus]: 'Infraspinatus_00000055693351133629568060000011005395473393824395_',
  [Muscle.TricepsBrachii]: 'Triceps_00000058563430122785195830000004356675806786654858_',
  [Muscle.Obliques]: [
    'Obliques_00000144307680268788205310000005818624216599975297_',
    'Upper_obliques_00000163063841218330492000000005773978221908945313_',
  ],
  [Muscle.Forearms]: [
    'Extensor_carpi_00000116200407099860938660000003262073282377889712_',
    'Extensor_digitorum_00000071523930808613392550000017694714289508163976_',
    'Extensor_carpi_ulnaris_00000134217785543749064480000005604883019983209609_',
    'Flexor_digitorium__x28_Under_arm_x29__00000159435954906204878840000011072027011836770979_',
  ],
  [Muscle.GluteusMaximus]: 'Gluteus_maximus_00000168110655002960868070000014188754410659059374_',
  [Muscle.GluteusMedius]: 'Gluteus_medius_00000112621038774864745760000016539011443425383349_',
  [Muscle.ThoracolumbarFascia]: 'Thoracolumbar_00000067950730854538543580000014263760795646897319_',
  [Muscle.Soleus]: [
    'Soleus_00000162330102282724997570000015371067798349489321_',
    'Soleus_00000162330102282724997570000015371067798349489349489321_',
  ],
  [Muscle.Calves]: 'Claves_00000142896635816991424760000005189009876859777974_',
  [Muscle.Quadriceps]: 'Outer_quads_00000121269285701693319920000012886749065288244405_',
};

/**
 * Front‐view map—using the `<g id="…">` strings from your *front* SVG.
 */
const frontMuscleIdMap: Partial<Record<Muscle, string | string[]>> = {
  [Muscle.PectoralisMajor]: 'Pecs_00000113330972391601112060000005331138571180189576_',
  [Muscle.UpperRectusAbdominis]: 'Upper_abs_00000046315355844623453780000011985032790848095113_',
  [Muscle.LowerRectusAbdominis]: [
    'Lower_abs_upper_00000119081192880914562810000012168525010772388750_',
    'Lower_abs_00000109003454546266000020000013768254758986680995_',
  ],
  [Muscle.Obliques]: 'Obliques_external_00000132808153117246191410000008142061127064473252_',
  [Muscle.SerratusAnterior]: 'Serratus_Anterior_00000078742877783113189840000003461162299842308526_',
  [Muscle.GluteusMedius]: 'Gluteus_medius_00000080201568885703178310000010756533600557290409_',
  [Muscle.GluteusMaximus]: 'Gluteus_maximus_00000168110655002960868070000014188754410659059374_',
  [Muscle.Quadriceps]: [
    'Outer_quads_00000121269285701693319920000012886749065288244405_',
    'Inner_quads_00000130614576889879192780000002899524873876548237_',
    'Inner_quads_00000132084545112020286850000018311130309988591026_',
    'Mid_quad_00000159455298854971660020000007518134995342161842_',
  ],
  [Muscle.Sartorius]: 'Sartorius__x28_inner_leg_x29__00000060747210191620450210000000874795006996621474_',
  [Muscle.AdductorMagnus]: 'Pectinius__x28_Inner_groin_muscle_x29__00000139279253852462966920000017582585951695724936_',
  [Muscle.PeroneusLongus]: 'Peroneus_longus_00000062179120547177543840000016909121641372359095_',
  [Muscle.Soleus]: 'Soleus_00000181065268647695928680000018209480433536768399_',
  [Muscle.Calves]: [
    'Calves__x28_medial_head_x29__00000152234539263550023980000009007724782308122012_',
    'Calves__x28_medial_head_x29__00000144309093221821848954800000014225574352369808823_',
    'Calves__x28_medial_head_x29__00000034059829512782314760000010611914542469866172_',
    'Calves__x28_medial_head_x29__00000116931660906523261270000008161269292030177950_',
    'Calves__x28_medial_head_x29__00000165214869862005764650000008485716200638106512_',
  ],
  [Muscle.Forearms]: [
    'Extensor__x28_fore_arm_lower_x29__00000012468373894602770780000006966979348039066248_',
    'Flexor_digitorium__x28_Under_arm_x29__00000159435954906204878840000011072027011836770979_',
  ],
  [Muscle.Brachioradialis]: 'Brachioradialis__x28_fore_arm_upper_x29__00000132086081680176933160000000575656365073902269_',
  [Muscle.Brachialis]: 'Biceps_Brachialis_00000003086861433688303320000017820228468836316309_',
  [Muscle.Sternocleidomastoid]: [
    'Sternocleids_00000000901235046718923910000008305278881673465734_',
    'Scm_00000050638738960208808000000011068059099103715510_',
  ],
  [Muscle.Trapezius]: 'Front_traps_00000021839012028885905390000000215930882222765978_',
  [Muscle.TricepsBrachii]: [
    'Triceps_long_head_00000083776378062729911360000007780280132728440204_',
    'triceps_lateral_head_00000114039035336761946620000010495095347100091037_',
  ],
  [Muscle.BicepsBrachii]: 'Biceps_brachii_00000165913426772514415860000005830889273115133587_',
  [Muscle.AnteriorDeltoid]: 'Deltoids_front_00000075869929722435460100000017330691835694619786_',
  [Muscle.LateralDeltoid]: 'Deltoids_side_00000075869929722435460100000017330691835694619787_',
  [Muscle.PosteriorDeltoid]: 'Deltoids_back_00000075869929722435460100000017330691835694619788_',
};

/**
 * MuscleActivationSVG
 *  - Displays the full-body SVG with muscle activation.
 *  - Implements scroll-blur effect and tappable functionality.
 */
export function MuscleActivationSVG({
  muscleVolumes = {},
  className,
  scrollElementRef,
  scale = 2 // Updated default scale to 2
}: MuscleActivationSVGProps) {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [isRotating, setIsRotating] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const modalSvgRef = useRef<SVGSVGElement>(null); // Separate ref for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'front' | 'back'>('front'); // Separate state for modal
  const [scrollPosition, setScrollPosition] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [isModalRotating, setIsModalRotating] = useState(false); // Separate rotating state for modal

  const BodySvg = view === 'front' ? FrontFullBody : BackFullBody;
  const ModalBodySvg = modalView === 'front' ? FrontFullBody : BackFullBody;
  const currentMuscleIdMap = view === 'front' ? frontMuscleIdMap : backMuscleIdMap;
  const modalMuscleIdMap = modalView === 'front' ? frontMuscleIdMap : backMuscleIdMap;

  // Initialize all muscles with 0 if undefined, and ensure all muscles are present
  const safeMuscleVolumes = useMemo(() => {
    const newVolumes: Record<Muscle, number> = {} as Record<Muscle, number>;

    // Initialize all muscles from the enum to 0
    Object.values(Muscle).forEach((muscle) => {
      if (typeof muscle === 'string') {
        newVolumes[muscle as Muscle] = muscleVolumes?.[muscle as Muscle] ?? 0; // Directly assign from prop or default to 0
      }
    });

    return newVolumes;
  }, [muscleVolumes]);

  // Get relevant muscles (those with volume > 0)
  const relevantMuscles = useMemo(() => {
    return Object.entries(safeMuscleVolumes)
      .filter(([, volume]) => volume > 0)
      .map(([muscle]) => muscle as Muscle);
  }, [safeMuscleVolumes]);

  const applyMuscleActivation = useCallback((targetRef: React.RefObject<SVGSVGElement>, muscleIdMap: Partial<Record<Muscle, string | string[]>>) => {
    if (!targetRef.current) return;

    console.log("MuscleActivationSVG - muscleVolumes prop:", muscleVolumes);
    console.log("MuscleActivationSVG - safeMuscleVolumes:", safeMuscleVolumes);
    console.log("MuscleActivationSVG - relevantMuscles:", relevantMuscles);

    const allGroupIds: string[] = Object.values(muscleIdMap).reduce<string[]>((acc, maybeId) => {
      if (!maybeId) return acc;
      return acc.concat(Array.isArray(maybeId) ? maybeId : [maybeId]);
    }, []);

    // First, hide all muscles to reset opacities
    allGroupIds.forEach((groupId) => {
      const g = targetRef.current!.querySelector<SVGGElement>(`#${groupId}`);
      if (g) g.style.opacity = '0';
    });

    // Then, apply activation opacities to relevant muscles
    relevantMuscles.forEach((muscle) => {
      const maybeId = muscleIdMap[muscle];
      if (!maybeId) return;

      const groupIds: string[] = Array.isArray(maybeId) ? maybeId : [maybeId];
      const volume = safeMuscleVolumes[muscle];
      const activation = getMuscleActivationLevel(volume);

      groupIds.forEach((groupId) => {
        const g = targetRef.current!.querySelector<SVGGElement>(`#${groupId}`);
        if (g) g.style.opacity = `${activation.opacity}`;
      });
    });
  }, [safeMuscleVolumes, relevantMuscles, muscleVolumes]);

  useEffect(() => {
    applyMuscleActivation(svgRef, currentMuscleIdMap);
  }, [applyMuscleActivation, currentMuscleIdMap]);

  useEffect(() => {
    if (isModalOpen) {
      // Reset modal state when opening
      setModalView('front');
      setIsModalRotating(false);
      applyMuscleActivation(modalSvgRef, modalMuscleIdMap);
    }
  }, [applyMuscleActivation, modalMuscleIdMap, isModalOpen]);

  useEffect(() => {
    const scrollElement = scrollElementRef?.current || window;
    console.log("MuscleActivationSVG - scrollElement:", scrollElement);
    const handleScroll = () => {
      setScrollPosition(scrollElement === window ? window.scrollY : (scrollElement as HTMLElement).scrollTop);
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [scrollElementRef]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only handle touch events on the SVG itself, not on buttons
    const target = e.target as Element;
    if (target.closest('button')) return;

    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX; // Initialize end position
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Only handle touch events on the SVG itself, not on buttons
    const target = e.target as Element;
    if (target.closest('button')) return;

    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Only handle touch events on the SVG itself, not on buttons
    const target = e.target as Element;
    if (target.closest('button')) return;

    const distance = touchEndX.current - touchStartX.current;
    const minSwipeDistance = 50; // Minimum distance for a swipe

    if (Math.abs(distance) >= minSwipeDistance) {
      if (distance > 0) {
        // Swiped right - show front
        handleViewChange('front');
      } else {
        // Swiped left - show back
        handleViewChange('back');
      }
    }
  };

  const handleViewChange = useCallback((newView: 'front' | 'back') => {
    if (newView === view || isRotating) return;

    setIsRotating(true);

    // Add a smooth 3D flip transition effect
    if (svgRef.current) {
      svgRef.current.style.transition = 'transform 0.3s ease-in-out';
      svgRef.current.style.transform = `scale(${scale}) rotateY(90deg)`;
    }

    const flipTimeout = setTimeout(() => {
      setView(newView);
      if (svgRef.current) {
        svgRef.current.style.transform = `scale(${scale}) rotateY(0deg)`;
      }

      const resetTimeout = setTimeout(() => {
        setIsRotating(false);
        if (svgRef.current) {
          svgRef.current.style.transition = '';
        }
      }, 150);

      return () => clearTimeout(resetTimeout);
    }, 150);

    return () => clearTimeout(flipTimeout);
  }, [view, isRotating, scale]);

  const handleModalViewChange = useCallback((newView: 'front' | 'back') => {
    if (newView === modalView || isModalRotating) return;

    setIsModalRotating(true);

    // Add a smooth 3D flip transition effect for modal
    if (modalSvgRef.current) {
      modalSvgRef.current.style.transition = 'transform 0.3s ease-in-out';
      modalSvgRef.current.style.transform = 'rotateY(90deg)';
    }

    const flipTimeout = setTimeout(() => {
      setModalView(newView);
      if (modalSvgRef.current) {
        modalSvgRef.current.style.transform = 'rotateY(0deg)';
      }

      const resetTimeout = setTimeout(() => {
        setIsModalRotating(false);
        if (modalSvgRef.current) {
          modalSvgRef.current.style.transition = '';
        }
      }, 150);

      return () => clearTimeout(resetTimeout);
    }, 150);

    return () => clearTimeout(flipTimeout);
  }, [modalView, isModalRotating]);

  return (
    <div
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        perspective: '1000px',
        paddingTop: '5px',
        touchAction: 'pan-y pinch-zoom' // Allow vertical scrolling but handle horizontal swipes
      }}
    >
      <BodySvg
        ref={svgRef}
        className="w-full h-full transition-transform duration-300 ease-in-out cursor-pointer"
        style={{
          transform: `scale(${scale})`,
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden'
        }}
        onClick={() => setIsModalOpen(true)}
      />

      {/* Left Arrow Button - Show Back */}
      <Button
        variant="ghost"
        size="icon"
        className={`absolute left-1 top-1/2 -translate-y-1/2 z-50 transition-all duration-200 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/20 ${isRotating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'} ${view === 'back' ? 'text-primary border-primary/50' : 'text-white hover:text-primary'}`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (!isRotating) {
            handleViewChange('back');
          }
        }}
        aria-label="Show Back View"
        disabled={isRotating}
        style={{
          pointerEvents: isRotating ? 'none' : 'auto',
          minWidth: '40px',
          minHeight: '40px'
        }}
      >
        <RotateCcw className={`h-5 w-5 transform rotate-180 transition-transform duration-200 ${isRotating ? 'rotate-360' : ''}`} />
      </Button>

      {/* Right Arrow Button - Show Front */}
      <Button
        variant="ghost"
        size="icon"
        className={`absolute right-1 top-1/2 -translate-y-1/2 z-50 transition-all duration-200 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/20 ${isRotating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'} ${view === 'front' ? 'text-primary border-primary/50' : 'text-white hover:text-primary'}`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (!isRotating) {
            handleViewChange('front');
          }
        }}
        aria-label="Show Front View"
        disabled={isRotating}
        style={{
          pointerEvents: isRotating ? 'none' : 'auto',
          minWidth: '40px',
          minHeight: '40px'
        }}
      >
        <RotateCcw className={`h-5 w-5 transition-transform duration-200 ${isRotating ? 'rotate-360' : ''}`} />
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Muscle Activation Details</DialogTitle>
            <DialogDescription>Detailed view of activated muscles.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center">
            <div className="relative w-full" style={{ perspective: '1000px', paddingTop: '5px' }}>
              <ModalBodySvg
                ref={modalSvgRef}
                className="w-full h-full transition-transform duration-300 ease-in-out"
                style={{
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden'
                }}
              />

              {/* Modal Left Arrow Button - Show Back */}
              <Button
                variant="ghost"
                size="icon"
                className={`absolute left-1 top-1/2 -translate-y-1/2 z-50 transition-all duration-200 rounded-full bg-gray-100/80 hover:bg-gray-200/80 backdrop-blur-sm border border-gray-300/50 ${isModalRotating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'} ${modalView === 'back' ? 'text-primary border-primary/50' : 'text-gray-600 hover:text-primary'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (!isModalRotating) {
                    handleModalViewChange('back');
                  }
                }}
                aria-label="Show Back View"
                disabled={isModalRotating}
                style={{
                  pointerEvents: isModalRotating ? 'none' : 'auto',
                  minWidth: '36px',
                  minHeight: '36px'
                }}
              >
                <RotateCcw className={`h-4 w-4 transform rotate-180 transition-transform duration-200 ${isModalRotating ? 'rotate-360' : ''}`} />
              </Button>

              {/* Modal Right Arrow Button - Show Front */}
              <Button
                variant="ghost"
                size="icon"
                className={`absolute right-1 top-1/2 -translate-y-1/2 z-50 transition-all duration-200 rounded-full bg-gray-100/80 hover:bg-gray-200/80 backdrop-blur-sm border border-gray-300/50 ${isModalRotating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'} ${modalView === 'front' ? 'text-primary border-primary/50' : 'text-gray-600 hover:text-primary'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (!isModalRotating) {
                    handleModalViewChange('front');
                  }
                }}
                aria-label="Show Front View"
                disabled={isModalRotating}
                style={{
                  pointerEvents: isModalRotating ? 'none' : 'auto',
                  minWidth: '36px',
                  minHeight: '36px'
                }}
              >
                <RotateCcw className={`h-4 w-4 transition-transform duration-200 ${isModalRotating ? 'rotate-360' : ''}`} />
              </Button>
            </div>

            <div className="mt-4 w-full">
              {relevantMuscles.map((muscle) => {
                const volume = safeMuscleVolumes[muscle];
                const { level } = getMuscleActivationLevel(volume);
                if (level === 'None') return null;
                return (
                  <div key={muscle} className="flex justify-between items-center py-1">
                    <span className="text-sm font-medium">{muscle}</span>
                    <span className={`text-xs font-semibold ${level === 'Low' ? 'text-green-500' : level === 'Medium' ? 'text-yellow-500' : 'text-red-500'}`}>
                      {level} ({volume.toFixed(0)} kg)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 